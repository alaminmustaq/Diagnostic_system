<?php

namespace App\Modules\Consultation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsultationController extends Controller
{
    public function queue(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();

        $selectedDoctorId = $request->integer('doctor_id');
        if (! $selectedDoctorId && $user && $user->isDoctor()) {
            $selectedDoctorId = $user->id;
        }

        $query = Visit::with(['patient', 'doctor.doctorProfile', 'followUps'])
            ->whereDate('visit_date', $today);

        if ($selectedDoctorId) {
            $query->where('doctor_id', $selectedDoctorId);
        }

        $visits = $query->orderBy('serial_number')->get();

        $doctors = User::with('doctorProfile')->where('role', 'doctor')->get();

        return Inertia::render('Consultation/Queue', [
            'visits' => $visits,
            'doctors' => $doctors,
            'selectedDoctorId' => $selectedDoctorId,
            'today' => $today,
        ]);
    }

    public function doctorRoom(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();

        $doctorId = ($user && $user->isDoctor()) ? $user->id : $request->integer('doctor_id');
        $doctor = $doctorId ? User::with('doctorProfile')->find($doctorId) : null;

        if (! $doctor) {
            $doctor = User::with('doctorProfile')->where('role', 'doctor')->first();
            $doctorId = $doctor?->id;
        }

        // Active patient currently in consultation
        $activeVisit = Visit::with([
            'patient.patientTreatments.treatment',
            'patient.patientVisits' => fn ($q) => $q->latest('visit_date'),
            'patient.patientFollowUps.doctor',
        ])
            ->where('doctor_id', $doctorId)
            ->whereDate('visit_date', $today)
            ->where('status', 'in_consultation')
            ->first();

        // Queue for this doctor
        $queue = Visit::with('patient')
            ->where('doctor_id', $doctorId)
            ->whereDate('visit_date', $today)
            ->orderBy('serial_number')
            ->get();

        $doctors = User::with('doctorProfile')->where('role', 'doctor')->get();

        return Inertia::render('Consultation/DoctorRoom', [
            'activeVisit' => $activeVisit,
            'queue' => $queue,
            'currentDoctor' => $doctor,
            'doctors' => $doctors,
            'today' => $today,
        ]);
    }

    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:waiting,in_consultation,completed,cancelled'],
        ]);

        $visit = Visit::findOrFail($id);

        // If setting this visit to in_consultation, ensure any previously in_consultation for this doctor is completed or handled if needed
        $visit->update(['status' => $validated['status']]);

        $statusLabels = [
            'waiting' => 'marked as Waiting',
            'in_consultation' => 'called into Consultation Room',
            'completed' => 'marked as Completed',
            'cancelled' => 'marked as Cancelled',
        ];

        return redirect()->back()->with('success', "Serial #{$visit->serial_number} {$statusLabels[$validated['status']]}.");
    }

    public function prescribeFollowUp(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'follow_up_date' => ['required', 'date', 'after:today'],
            'complete_visit' => ['boolean'],
        ]);

        $visit = Visit::with('patient')->findOrFail($id);

        FollowUp::create([
            'patient_id' => $visit->patient_id,
            'doctor_id' => $visit->doctor_id,
            'source_visit_id' => $visit->id,
            'follow_up_date' => $validated['follow_up_date'],
            'status' => 'pending',
            'is_notified' => false,
        ]);

        if ($request->boolean('complete_visit', true)) {
            $visit->update(['status' => 'completed']);
        }

        return redirect()->back()->with('success', "Follow-up scheduled for {$validated['follow_up_date']} and consultation marked complete!");
    }
}

