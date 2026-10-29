<?php

namespace App\Modules\Reports\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\PatientTreatment;
use App\Models\Payment;
use App\Models\Treatment;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->query('tab', 'visits');

        $doctors = User::with('doctorProfile')->where('role', 'doctor')->get();
        $treatmentsList = Treatment::orderBy('name')->get();
        $patients = User::where('role', 'patient')->orderBy('name')->take(100)->get();

        $startDate = $request->input('start_date', Carbon::today()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());

        $reportData = match ($tab) {
            'followups' => $this->getFollowUpReport($request, $startDate, $endDate),
            'treatments' => $this->getTreatmentReport($request, $startDate, $endDate),
            'payments' => $this->getPaymentReport($request, $startDate, $endDate),
            default => $this->getVisitReport($request, $startDate, $endDate),
        };

        return Inertia::render('Reports/Index', [
            'activeTab' => $tab,
            'reportData' => $reportData,
            'doctors' => $doctors,
            'treatmentsList' => $treatmentsList,
            'patients' => $patients,
            'filters' => [
                'tab' => $tab,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'doctor_id' => $request->input('doctor_id'),
                'patient_id' => $request->input('patient_id'),
                'treatment_id' => $request->input('treatment_id'),
                'payment_type' => $request->input('payment_type'),
                'status' => $request->input('status'),
            ],
        ]);
    }

    private function getVisitReport(Request $request, string $startDate, string $endDate): array
    {
        $query = Visit::with(['patient', 'doctor.doctorProfile'])
            ->whereBetween('visit_date', [$startDate, $endDate]);

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $records = $query->orderBy('visit_date', 'desc')->orderBy('serial_number', 'asc')->get();

        return [
            'records' => $records,
            'summary' => [
                'total_visits' => $records->count(),
                'completed' => $records->where('status', 'completed')->count(),
                'in_consultation' => $records->where('status', 'in_consultation')->count(),
                'waiting' => $records->where('status', 'waiting')->count(),
                'cancelled' => $records->where('status', 'cancelled')->count(),
            ],
        ];
    }

    private function getFollowUpReport(Request $request, string $startDate, string $endDate): array
    {
        $query = FollowUp::with(['patient', 'doctor.doctorProfile', 'sourceVisit'])
            ->whereBetween('follow_up_date', [$startDate, $endDate]);

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $records = $query->orderBy('follow_up_date', 'desc')->get();

        $total = $records->count();
        $completed = $records->where('status', 'completed')->count();
        $returnRate = $total > 0 ? round(($completed / $total) * 100, 1) : 0;

        return [
            'records' => $records,
            'summary' => [
                'total_scheduled' => $total,
                'returned_completed' => $completed,
                'pending' => $records->where('status', 'pending')->count(),
                'cancelled' => $records->where('status', 'cancelled')->count(),
                'return_rate_percentage' => $returnRate,
            ],
        ];
    }

    private function getTreatmentReport(Request $request, string $startDate, string $endDate): array
    {
        $query = PatientTreatment::with(['patient', 'treatment.category'])
            ->whereBetween('date_administered', [$startDate, $endDate]);

        if ($request->filled('treatment_id')) {
            $query->where('treatment_id', $request->integer('treatment_id'));
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }

        $records = $query->orderBy('date_administered', 'desc')->get();

        // Group by treatment to compute popular services rendered
        $treatmentBreakdown = $records->groupBy('treatment_id')->map(function ($items) {
            $first = $items->first();
            $treatment = $first->treatment;
            $count = $items->count();
            $price = $treatment ? (float) $treatment->price : 0;
            return [
                'treatment_name' => $treatment ? $treatment->name : 'Unknown',
                'category' => $treatment?->category?->name ?? 'General',
                'count' => $count,
                'estimated_revenue' => $count * $price,
            ];
        })->sortByDesc('count')->values();

        $totalRevenue = $treatmentBreakdown->sum('estimated_revenue');

        return [
            'records' => $records,
            'breakdown' => $treatmentBreakdown,
            'summary' => [
                'total_treatments_administered' => $records->count(),
                'unique_services_rendered' => $treatmentBreakdown->count(),
                'estimated_gross_volume' => $totalRevenue,
            ],
        ];
    }

    private function getPaymentReport(Request $request, string $startDate, string $endDate): array
    {
        $query = Payment::with(['patient', 'collectedBy'])
            ->whereBetween('payment_date', [$startDate, $endDate]);

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->integer('patient_id'));
        }

        if ($request->filled('payment_type')) {
            $query->where('payment_type', $request->string('payment_type'));
        }

        $records = $query->orderBy('payment_date', 'desc')->get();

        $visitRevenue = $records->where('payment_type', 'visit')->sum('final_paid_amount');
        $treatmentRevenue = $records->where('payment_type', 'treatment')->sum('final_paid_amount');
        $totalCollected = $records->sum('final_paid_amount');
        $totalDiscount = $records->sum('discount_amount');

        // Group by date for daily revenue trend
        $dailyTrend = $records->groupBy(fn ($p) => $p->payment_date->format('Y-m-d'))->map(function ($items, $date) {
            return [
                'date' => $date,
                'visit' => $items->where('payment_type', 'visit')->sum('final_paid_amount'),
                'treatment' => $items->where('payment_type', 'treatment')->sum('final_paid_amount'),
                'total' => $items->sum('final_paid_amount'),
            ];
        })->values();

        return [
            'records' => $records,
            'daily_trend' => $dailyTrend,
            'summary' => [
                'total_collected' => $totalCollected,
                'visit_revenue' => $visitRevenue,
                'treatment_revenue' => $treatmentRevenue,
                'total_discount_given' => $totalDiscount,
                'transactions_count' => $records->count(),
            ],
        ];
    }
}

