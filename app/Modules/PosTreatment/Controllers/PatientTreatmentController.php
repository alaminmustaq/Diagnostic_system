<?php

namespace App\Modules\PosTreatment\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PatientTreatment;
use App\Models\Treatment;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientTreatmentController extends Controller
{
    /**
     * Display the dedicated patient treatments records list page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (!$user->can('view-patient-treatments') && !$user->can('view-pos-treatment')) {
            abort(403, 'Unauthorized action: You do not have permission to view patient treatments.');
        }

        $today = Carbon::today()->toDateString();
        $status = $request->query('status', 'all');
        $search = trim($request->query('search', ''));
        $dateFilter = $request->query('date', '');

        $query = PatientTreatment::with([
            'patient',
            'treatment.category',
            'treatment.room',
            'payment.splits.bankAccount',
        ]);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($dateFilter) {
            $query->whereDate('date_administered', $dateFilter);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('token_number', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('user_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('treatment', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $patientTreatments = $query->latest('id')->take(200)->get();

        // High-level queue & log statistics
        $statsQuery = PatientTreatment::query();
        if ($dateFilter) {
            $statsQuery->whereDate('date_administered', $dateFilter);
        }

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'waiting' => (clone $statsQuery)->where('status', 'waiting')->count(),
            'in_collection' => (clone $statsQuery)->where('status', 'in_collection')->count(),
            'sample' => (clone $statsQuery)->where('status', 'sample')->count(),
            'today_total' => PatientTreatment::whereDate('date_administered', $today)->count(),
        ];

        $allTreatments = Treatment::with(['category', 'room'])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('PatientTreatments/Index', [
            'patientTreatments' => $patientTreatments,
            'allTreatments' => $allTreatments,
            'filters' => [
                'status' => $status,
                'search' => $search,
                'date' => $dateFilter,
            ],
            'stats' => $stats,
            'today' => $today,
        ]);
    }

    /**
     * Update an individual patient treatment record.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->can('update-patient-treatments') &&
            !$user->can('edit-patient-treatments') &&
            !$user->can('update-pos-treatment') &&
            !$user->can('edit-pos-treatment')) {
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
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user->can('delete-patient-treatments') && !$user->can('delete-pos-treatment')) {
            abort(403, 'Unauthorized action: You do not have permission to delete patient treatments.');
        }

        $record = PatientTreatment::findOrFail($id);
        $token = $record->token_number ?: "#{$record->id}";
        $record->delete();

        return redirect()->back()->with('success', "Patient treatment record {$token} deleted successfully.");
    }
}

