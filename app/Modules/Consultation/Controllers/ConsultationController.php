<?php

namespace App\Modules\Consultation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\PatientTreatment;
use App\Models\Treatment;
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

        $treatmentQueue = PatientTreatment::with(['patient', 'treatment.category', 'treatment.room'])
            ->whereDate('date_administered', $today)
            ->orderBy('id', 'asc')
            ->get();

        $allTreatments = Treatment::with('category')->where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Consultation/Queue', [
            'visits' => $visits,
            'doctors' => $doctors,
            'selectedDoctorId' => $selectedDoctorId,
            'treatmentQueue' => $treatmentQueue,
            'allTreatments' => $allTreatments,
            'today' => $today,
            'activeTab' => $request->query('tab', 'visits'),
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

        $user = $request->user();

        if ($validated['status'] === 'in_consultation') {
            if (!$user->can('call-patient')) {
                abort(403, 'Unauthorized action: You do not have permission to call patients.');
            }
        } elseif ($validated['status'] === 'cancelled') {
            if (!$user->can('cancel-serial')) {
                abort(403, 'Unauthorized action: You do not have permission to cancel serials.');
            }
        } else {
            if (!$user->can('update-consultation-queue') && !$user->can('edit-consultation-queue') && !$user->can('call-patient')) {
                abort(403, 'Unauthorized action: You do not have permission to update consultation status.');
            }
        }

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

    public function updateTreatmentStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:waiting,in_collection,sample'],
        ]);

        $user = $request->user();

        if ($validated['status'] === 'in_collection') {
            if (!$user->can('in-collection')) {
                abort(403, 'Unauthorized action: You do not have permission to mark treatment as In Collection.');
            }
        } elseif ($validated['status'] === 'sample') {
            if (!$user->can('sample')) {
                abort(403, 'Unauthorized action: You do not have permission to mark sample as done.');
            }
        } else {
            if (!$user->can('update-consultation-queue') && !$user->can('edit-consultation-queue') && !$user->can('in-collection')) {
                abort(403, 'Unauthorized action: You do not have permission to update treatment status.');
            }
        }

        $treatment = PatientTreatment::with('treatment')->findOrFail($id);

        // If it is already marked as sample, no further status changes are permitted
        if ($treatment->status === 'sample') {
            return redirect()->back()->with('error', 'This treatment is already marked as sample (done) and cannot be changed.');
        }

        $treatment->update(['status' => $validated['status']]);

        $statusLabels = [
            'waiting' => 'marked as Waiting',
            'in_collection' => 'marked as In Collection',
            'sample' => 'marked as Sample (Treatment Done)',
        ];

        return redirect()->back()->with('success', "Treatment token {$treatment->token_number} {$statusLabels[$validated['status']]}.");
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

    public function updateTreatment(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->can('update-consultation-queue') && !$user->can('edit-consultation-queue') && !$user->can('edit-pos-treatment')) {
            abort(403, 'Unauthorized action: You do not have permission to edit treatments.');
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

        return redirect()->back()->with('success', "Treatment record {$record->token_number} updated successfully.");
    }

    public function destroyTreatment(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->can('delete-consultation-queue') && !$user->can('delete-pos-treatment')) {
            abort(403, 'Unauthorized action: You do not have permission to delete treatments.');
        }

        $record = PatientTreatment::findOrFail($id);
        $token = $record->token_number ?: "#{$record->id}";
        $record->delete();

        return redirect()->back()->with('success', "Treatment record {$token} deleted successfully.");
    }
}

