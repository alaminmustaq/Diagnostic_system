<?php

namespace App\Modules\PosTreatment\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\PatientTreatment;
use App\Models\Payment;
use App\Models\PaymentSplit;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PosTreatmentController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today()->toDateString();

        $categories = TreatmentCategory::with(['treatments' => fn ($q) => $q->where('is_active', true)->orderBy('ordering')])
            ->where('is_active', true)
            ->orderBy('ordering')
            ->get();

        $bankAccounts = BankAccount::bank()->where('is_active', true)->orderBy('bank_name')->get();
        $mobileBankingAccounts = BankAccount::mobileBanking()->where('is_active', true)->orderBy('account_name')->get();

        $recentPayments = Payment::with(['patient', 'collectedBy', 'bankAccount', 'splits.bankAccount', 'patientTreatments.treatment.room'])
            ->where('payment_type', 'treatment')
            ->whereDate('payment_date', $today)
            ->latest('id')
            ->take(15)
            ->get();

        return Inertia::render('PosTreatment/Index', [
            'categories' => $categories,
            'recentPayments' => $recentPayments,
            'bankAccounts' => $bankAccounts,
            'mobileBankingAccounts' => $mobileBankingAccounts,
            'today' => $today,
            'lastInvoice' => session('last_invoice'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:255'],
            'treatment_ids' => ['required', 'array', 'min:1'],
            'treatment_ids.*' => ['required', 'exists:treatments,id'],
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
            'payment_date' => ['nullable', 'date'],
        ]);

        $paymentDate = $validated['payment_date'] ?? Carbon::today()->toDateString();

        $invoice = DB::transaction(function () use ($validated, $paymentDate) {
            // 1. Patient lookup or creation
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

            // 2. Calculate daily treatment queue serial & token
            $lastSerial = PatientTreatment::whereDate('date_administered', $paymentDate)
                ->lockForUpdate()
                ->max('serial_number') ?? 0;

            $serialNumber = $lastSerial + 1;
            $datePart = Carbon::parse($paymentDate)->format('dmy');
            $tokenNumber = "TRT-{$datePart}-" . str_pad((string) $serialNumber, 3, '0', STR_PAD_LEFT);

            // 3. Insert into payments & splits & generate invoice
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

            $finalAmount = (float) $validated['final_paid_amount'];
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
                'payment_type' => Payment::TYPE_TREATMENT,
                'payment_method' => $topMethod,
                'bank_account_id' => $topBankId,
                'collected_by' => $collectorId,
                'base_amount' => $validated['base_amount'],
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_amount' => $validated['discount_amount'] ?? 0.00,
                'final_paid_amount' => $finalAmount,
                'payment_date' => $paymentDate,
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

            $invoiceNo = Payment::generateInvoiceNumber(Payment::TYPE_TREATMENT, $payment->id);
            $payment->update(['invoice_number' => $invoiceNo]);

            // 4. Insert into patient_treatments
            $selectedTreatments = Treatment::with(['category', 'room'])->whereIn('id', $validated['treatment_ids'])->get();

            foreach ($selectedTreatments as $treatment) {
                PatientTreatment::create([
                    'patient_id' => $patient->id,
                    'treatment_id' => $treatment->id,
                    'payment_id' => $payment->id,
                    'invoice_number' => $invoiceNo,
                    'serial_number' => $serialNumber,
                    'token_number' => $tokenNumber,
                    'status' => 'waiting',
                    'date_administered' => $paymentDate,
                ]);
            }

            $splitsData = $payment->splits()->with('bankAccount')->get()->map(fn ($s) => [
                'id' => $s->id,
                'payment_method' => $s->payment_method,
                'amount' => (string) $s->amount,
                'bank_name' => $s->bankAccount ? ($s->bankAccount->bank_name ?: $s->bankAccount->account_name) : null,
                'account_number' => $s->bankAccount?->account_number,
                'account_type' => $s->bankAccount?->account_type,
            ])->toArray();

            return [
                'id' => $payment->id,
                'invoice_no' => $invoiceNo,
                'token_number' => $tokenNumber,
                'payment_method' => $payment->payment_method,
                'bank_account_name' => $payment->bankAccount ? ($payment->bankAccount->bank_name ?: $payment->bankAccount->account_name) : null,
                'bank_account_number' => $payment->bankAccount?->account_number,
                'payment_splits' => $splitsData,
                'date' => $paymentDate,
                'patient' => [
                    'id' => $patient->id,
                    'user_code' => $patient->user_code,
                    'name' => $patient->name,
                    'phone' => $patient->phone,
                ],
                'items' => $selectedTreatments->map(fn ($t) => [
                    'name' => $t->name,
                    'price' => $t->price,
                    'room_number' => $t->room?->room_number,
                ]),
                'base_amount' => $payment->base_amount,
                'discount_type' => $payment->discount_type,
                'discount_amount' => $payment->discount_amount,
                'final_paid_amount' => $payment->final_paid_amount,
            ];
        });

        return redirect()->route('pos.index')
            ->with('success', "Treatment recorded and invoice {$invoice['invoice_no']} generated successfully!")
            ->with('last_invoice', $invoice);
    }

    /**
     * Update an individual patient treatment record.
     */
    public function updatePatientTreatment(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->can('update-pos-treatment') && !$user->can('edit-pos-treatment')) {
            abort(403, 'Unauthorized action: You do not have permission to edit patient treatments.');
        }

        $validated = $request->validate([
            'treatment_id' => ['required', 'exists:treatments,id'],
            'status' => ['required', 'in:waiting,in_collection,sample'],
            'date_administered' => ['required', 'date'],
        ]);

        $record = PatientTreatment::with('treatment')->findOrFail($id);
        $record->update([
            'treatment_id' => $validated['treatment_id'],
            'status' => $validated['status'],
            'date_administered' => $validated['date_administered'],
        ]);

        return redirect()->back()->with('success', "Patient treatment record {$record->token_number} updated successfully.");
    }

    /**
     * Delete an individual patient treatment record.
     */
    public function destroyPatientTreatment(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->can('delete-pos-treatment')) {
            abort(403, 'Unauthorized action: You do not have permission to delete patient treatments.');
        }

        $record = PatientTreatment::findOrFail($id);
        $token = $record->token_number ?: "#{$record->id}";
        $record->delete();

        return redirect()->back()->with('success', "Patient treatment record {$token} deleted successfully.");
    }
}

