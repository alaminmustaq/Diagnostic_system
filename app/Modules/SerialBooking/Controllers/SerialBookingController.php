<?php

namespace App\Modules\SerialBooking\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\Payment;
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

        $recentVisits = Visit::with(['patient', 'doctor.doctorProfile'])
            ->whereDate('visit_date', $today)
            ->orderBy('id', 'desc')
            ->take(15)
            ->get();

        return Inertia::render('SerialBooking/Index', [
            'doctors' => $doctors,
            'recentVisits' => $recentVisits,
            'today' => $today,
            'lastBookedVisit' => session('booked_visit'),
        ]);
    }

    public function searchPatient(Request $request): JsonResponse
    {
        $phone = trim((string) $request->query('phone'));

        if (empty($phone)) {
            return response()->json([
                'exists' => false,
                'patient' => null,
                'has_prior_visits' => false,
                'pending_follow_up' => null,
                'matches' => [],
            ]);
        }

        // Live prefix search for autocomplete dropdown
        $matchingUsers = User::where('role', 'patient')
            ->where('phone', 'like', "{$phone}%")
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
                'name' => $p->name,
                'phone' => $p->phone,
                'has_prior_visits' => $hasPriorVisits,
                'pending_follow_up' => $pendingFollowUp,
            ];
        });

        $exactPatient = User::where('phone', $phone)->first();

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
        ]);

        $result = DB::transaction(function () use ($validated, $request) {
            // 1. Find or create patient
            $patient = User::firstOrCreate(
                ['phone' => $validated['phone']],
                [
                    'name' => $validated['name'],
                    'role' => 'patient',
                    'password' => null,
                ]
            );

            // Update name if changed
            if ($patient->name !== $validated['name']) {
                $patient->update(['name' => $validated['name']]);
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

            // 4. Record Payment if fee charged
            $finalAmount = (float) $validated['final_paid_amount'];
            $collectorId = Auth::id() ?: User::where('role', 'admin')->value('id') ?: $patient->id;

            $payment = null;
            if ($finalAmount > 0 || (float) $validated['base_amount'] > 0) {
                $payment = Payment::create([
                    'patient_id' => $patient->id,
                    'payment_type' => 'visit',
                    'collected_by' => $collectorId,
                    'base_amount' => $validated['base_amount'],
                    'discount_type' => $validated['discount_type'] ?? null,
                    'discount_amount' => $validated['discount_amount'] ?? 0.00,
                    'final_paid_amount' => $finalAmount,
                    'payment_date' => $visitDate,
                ]);
            }

            // 5. Smart Auto-Resolve: auto-complete any pending follow-ups for this patient!
            $resolvedCount = FollowUp::where('patient_id', $patient->id)
                ->where('status', 'pending')
                ->update(['status' => 'completed']);

            return [
                'visit' => $visit->load(['patient', 'doctor.doctorProfile']),
                'payment' => $payment,
                'resolved_follow_ups' => $resolvedCount,
            ];
        });

        return redirect()->route('booking.index')
            ->with('success', "Serial #{$result['visit']->serial_number} booked successfully! Token: {$result['visit']->token_number}")
            ->with('booked_visit', [
                'id' => $result['visit']->id,
                'serial_number' => $result['visit']->serial_number,
                'token_number' => $result['visit']->token_number,
                'visit_date' => $result['visit']->visit_date->format('Y-m-d'),
                'patient_name' => $result['visit']->patient->name,
                'patient_phone' => $result['visit']->patient->phone,
                'doctor_name' => $result['visit']->doctor->name,
                'doctor_designation' => $result['visit']->doctor->doctorProfile?->designation,
                'room_number' => $result['visit']->doctor->doctorProfile?->room_number,
                'fee' => $result['payment'] ? $result['payment']->final_paid_amount : '0.00',
                'auto_resolved_follow_up' => $result['resolved_follow_ups'] > 0,
            ]);
    }
}

