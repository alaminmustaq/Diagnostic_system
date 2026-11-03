<?php

namespace App\Modules\PosTreatment\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PatientTreatment;
use App\Models\Payment;
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

        $recentPayments = Payment::with(['patient', 'collectedBy'])
            ->where('payment_type', 'treatment')
            ->whereDate('payment_date', $today)
            ->latest('id')
            ->take(15)
            ->get();

        return Inertia::render('PosTreatment/Index', [
            'categories' => $categories,
            'recentPayments' => $recentPayments,
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

            // 3. Insert into payments
            $collectorId = Auth::id() ?: User::where('role', 'admin')->value('id') ?: $patient->id;

            $payment = Payment::create([
                'patient_id' => $patient->id,
                'payment_type' => 'treatment',
                'collected_by' => $collectorId,
                'base_amount' => $validated['base_amount'],
                'discount_type' => $validated['discount_type'] ?? null,
                'discount_amount' => $validated['discount_amount'] ?? 0.00,
                'final_paid_amount' => $validated['final_paid_amount'],
                'payment_date' => $paymentDate,
            ]);

            // 4. Insert into patient_treatments
            $selectedTreatments = Treatment::with(['category', 'room'])->whereIn('id', $validated['treatment_ids'])->get();

            foreach ($selectedTreatments as $treatment) {
                PatientTreatment::create([
                    'patient_id' => $patient->id,
                    'treatment_id' => $treatment->id,
                    'payment_id' => $payment->id,
                    'serial_number' => $serialNumber,
                    'token_number' => $tokenNumber,
                    'status' => 'waiting',
                    'date_administered' => $paymentDate,
                ]);
            }

            return [
                'id' => $payment->id,
                'invoice_no' => 'INV-TRT-' . str_pad((string) $payment->id, 5, '0', STR_PAD_LEFT),
                'token_number' => $tokenNumber,
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
            ->with('success', 'Treatment recorded and payment collected successfully!')
            ->with('last_invoice', $invoice);
    }
}

