<?php

namespace App\Modules\SerialBooking\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\FollowUp;
use App\Models\Payment;
use App\Models\PaymentSplit;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SerialBookingController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today()->toDateString();

        $doctors = User::with('doctorProfile')
            ->where('role', 'doctor')
            ->get();

        $bankAccounts = BankAccount::bank()->where('is_active', true)->orderBy('bank_name')->get();
        $mobileBankingAccounts = BankAccount::mobileBanking()->where('is_active', true)->orderBy('account_name')->get();

        $recentVisits = Visit::with(['patient', 'doctor.doctorProfile', 'payment.bankAccount', 'payment.splits.bankAccount'])
            ->whereDate('visit_date', $today)
            ->orderBy('id', 'desc')
            ->take(15)
            ->get();

        $recentVisits->each(function ($visit) {
            $visit->fee = $visit->payment ? (string) $visit->payment->final_paid_amount : '0.00';
        });

        return Inertia::render('SerialBooking/Index', [
            'doctors' => $doctors,
            'recentVisits' => $recentVisits,
            'bankAccounts' => $bankAccounts,
            'mobileBankingAccounts' => $mobileBankingAccounts,
            'today' => $today,
            'lastBookedVisit' => session('booked_visit'),
        ]);
    }

    public function searchPatient(Request $request): JsonResponse
    {
        $search = trim((string) ($request->query('phone') ?? $request->query('query') ?? $request->query('code')));

        if (empty($search)) {
            return response()->json([
                'exists' => false,
                'patient' => null,
                'has_prior_visits' => false,
                'pending_follow_up' => null,
                'matches' => [],
            ]);
        }

        // Live prefix or partial search for autocomplete dropdown by phone OR user_code
        $matchingUsers = User::where('role', 'patient')
            ->where(function ($q) use ($search) {
                $q->where('phone', 'like', "%{$search}%")
                    ->orWhere('user_code', 'like', "%{$search}%");
            })
            ->take(10)
            ->get();

        $matches = $matchingUsers->map(function ($p) {
            $hasPriorVisits = Visit::where('patient_id', $p->id)->exists();
            $pendingFollowUp = FollowUp::with('doctor')
                ->where('patient_id', $p->id)
                ->where('status', 'pending')
                ->latest('follow_up_date')
                ->first();

            return [
                'id' => $p->id,
                'user_code' => $p->user_code,
                'name' => $p->name,
                'phone' => $p->phone,
                'has_prior_visits' => $hasPriorVisits,
                'pending_follow_up' => $pendingFollowUp,
            ];
        });

        // Exact match by phone OR user_code
        $exactPatient = User::where('role', 'patient')
            ->where(function ($q) use ($search) {
                $q->where('phone', $search)
                    ->orWhereRaw('LOWER(user_code) = ?', [strtolower($search)]);
            })
            ->first();

        if (! $exactPatient) {
            return response()->json([
                'exists' => false,
                'patient' => null,
                'has_prior_visits' => false,
                'pending_follow_up' => null,
                'matches' => $matches,
            ]);
        }

        $hasPriorVisits = Visit::where('patient_id', $exactPatient->id)->exists();

        $pendingFollowUp = FollowUp::with('doctor')
            ->where('patient_id', $exactPatient->id)
            ->where('status', 'pending')
            ->latest('follow_up_date')
            ->first();

        return response()->json([
            'exists' => true,
            'patient' => [
                'id' => $exactPatient->id,
                'user_code' => $exactPatient->user_code,
                'name' => $exactPatient->name,
                'phone' => $exactPatient->phone,
            ],
            'has_prior_visits' => $hasPriorVisits,
            'pending_follow_up' => $pendingFollowUp,
            'matches' => $matches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:255'],
            'doctor_id' => ['required', 'exists:users,id'],
            'visit_date' => ['required', 'date'],
            'base_amount' => ['required', 'numeric', 'min:0'],
            'discount_type' => ['nullable', 'in:fixed,percentage'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'final_paid_amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string', 'in:cash,bank,mobile_banking,multiple'],
            'bank_account_id' => ['nullable', 'required_if:payment_method,bank,mobile_banking', 'exists:bank_accounts,id'],
            'payment_splits' => ['nullable', 'array'],
            'payment_splits.*.payment_method' => ['required_with:payment_splits', 'string', 'in:cash,bank,mobile_banking'],
            'payment_splits.*.bank_account_id' => ['nullable', 'required_if:payment_splits.*.payment_method,bank,mobile_banking', 'exists:bank_accounts,id'],
            'payment_splits.*.amount' => ['required_with:payment_splits', 'numeric', 'min:0.01'],
            'payment_splits.*.transaction_reference' => ['nullable', 'string', 'max:100'],
        ]);

        $result = DB::transaction(function () use ($validated, $request) {
            // 1. Find or create patient
            $patient = User::where('phone', $validated['phone'])->first();

            if (! $patient) {
                $patient = User::create([
                    'phone' => $validated['phone'],
                    'name' => $validated['name'],
                    'role' => 'patient',
                    'user_code' => User::generatePatientCode(),
                    'password' => null,
                ]);
            } else {
                if ($patient->name !== $validated['name']) {
                    $patient->update(['name' => $validated['name']]);
                }
                if (empty($patient->user_code)) {
                    $patient->update(['user_code' => User::generatePatientCode()]);
                }
            }

            $visitDate = $validated['visit_date'];

            // 2. Queue serial number for this doctor and date
            $lastSerial = Visit::where('doctor_id', $validated['doctor_id'])
                ->whereDate('visit_date', $visitDate)
                ->lockForUpdate()
                ->max('serial_number') ?? 0;

            $serialNumber = $lastSerial + 1;

            // 3. Create Visit
            $visit = Visit::create([
                'patient_id' => $patient->id,
                'doctor_id' => $validated['doctor_id'],
                'visit_date' => $visitDate,
                'serial_number' => $serialNumber,
                'status' => 'waiting',
            ]);

            // 4. Record Payment, Splits & Generate Invoice
            $finalAmount = (float) $validated['final_paid_amount'];
            $collectorId = Auth::id() ?: User::where('role', 'admin')->value('id') ?: $patient->id;

            $splits = [];
            if (!empty($validated['payment_splits'])) {
                foreach ($validated['payment_splits'] as $s) {
                    $amt = (float) $s['amount'];
                    if ($amt > 0) {
                        $splits[] = [
                            'payment_method' => $s['payment_method'],
                            'bank_account_id' => in_array($s['payment_method'], ['bank', 'mobile_banking']) ? ($s['bank_account_id'] ?? null) : null,
                            'amount' => $amt,
                            'transaction_reference' => $s['transaction_reference'] ?? null,
                        ];
                    }
                }
            }

            if (empty($splits) && $finalAmount > 0) {
                $paymentMethod = $validated['payment_method'] ?? 'cash';
                $bankAccountId = in_array($paymentMethod, ['bank', 'mobile_banking']) ? ($validated['bank_account_id'] ?? null) : null;
                $splits[] = [
                    'payment_method' => $paymentMethod,
                    'bank_account_id' => $bankAccountId,
                    'amount' => $finalAmount,
                    'transaction_reference' => null,
                ];
            }

            if (count($splits) === 1) {
                $topMethod = $splits[0]['payment_method'];
                $topBankId = $splits[0]['bank_account_id'];
            } elseif (count($splits) > 1) {
                $uniqueMethods = array_unique(array_column($splits, 'payment_method'));
                $topMethod = count($uniqueMethods) === 1 ? reset($uniqueMethods) : Payment::METHOD_MULTIPLE;
                $topBankId = null;
            } else {
                $topMethod = 'cash';
                $topBankId = null;
            }

            $payment = Payment::create([
                'patient_id' => $patient->id,
                'visit_id' => $visit->id,
                'payment_type' => Payment::TYPE_VISIT,
                'payment_method' => $topMethod,
                'bank_account_id' => $topBankId,
                'collected_by' => $collectorId,
                'base_amount' => $validated['base_amount'],
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_amount' => $validated['discount_amount'] ?? 0.00,
                'final_paid_amount' => $finalAmount,
                'payment_date' => $visitDate,
            ]);

            foreach ($splits as $split) {
                PaymentSplit::create([
                    'payment_id' => $payment->id,
                    'payment_method' => $split['payment_method'],
                    'bank_account_id' => $split['bank_account_id'],
                    'amount' => $split['amount'],
                    'transaction_reference' => $split['transaction_reference'],
                ]);
            }

            $invoiceNumber = Payment::generateInvoiceNumber(Payment::TYPE_VISIT, $payment->id);
            $payment->update(['invoice_number' => $invoiceNumber]);
            $visit->update([
                'payment_id' => $payment->id,
                'invoice_number' => $invoiceNumber,
            ]);

            // 5. Smart Auto-Resolve: auto-complete any pending follow-ups for this patient!
            $resolvedCount = FollowUp::where('patient_id', $patient->id)
                ->where('status', 'pending')
                ->update(['status' => 'completed']);

            return [
                'visit' => $visit->load(['patient', 'doctor.doctorProfile']),
                'payment' => $payment->load(['bankAccount', 'splits.bankAccount']),
                'resolved_follow_ups' => $resolvedCount,
            ];
        });

        $splitsData = $result['payment']->splits->map(fn ($s) => [
            'id' => $s->id,
            'payment_method' => $s->payment_method,
            'amount' => (string) $s->amount,
            'bank_name' => $s->bankAccount ? ($s->bankAccount->bank_name ?: $s->bankAccount->account_name) : null,
            'account_number' => $s->bankAccount?->account_number,
            'account_type' => $s->bankAccount?->account_type,
        ])->toArray();

        return redirect()->route('booking.index')
            ->with('success', "Serial #{$result['visit']->serial_number} booked successfully! Invoice: {$result['payment']->invoice_number}")
            ->with('booked_visit', [
                'id' => $result['visit']->id,
                'serial_number' => $result['visit']->serial_number,
                'token_number' => $result['visit']->token_number,
                'invoice_number' => $result['payment']->invoice_number,
                'payment_method' => $result['payment']->payment_method,
                'bank_account_name' => $result['payment']->bankAccount ? ($result['payment']->bankAccount->bank_name ?: $result['payment']->bankAccount->account_name) : null,
                'bank_account_number' => $result['payment']->bankAccount?->account_number,
                'payment_splits' => $splitsData,
                'visit_date' => $result['visit']->visit_date->format('Y-m-d'),
                'patient_name' => $result['visit']->patient->name,
                'patient_phone' => $result['visit']->patient->phone,
                'doctor_name' => $result['visit']->doctor->name,
                'doctor_designation' => $result['visit']->doctor->doctorProfile?->designation,
                'room_number' => $result['visit']->doctor->doctorProfile?->room_number,
                'fee' => (string) $result['payment']->final_paid_amount,
                'auto_resolved_follow_up' => $result['resolved_follow_ups'] > 0,
            ]);
    }
}

