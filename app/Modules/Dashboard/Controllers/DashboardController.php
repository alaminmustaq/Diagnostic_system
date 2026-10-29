<?php

namespace App\Modules\Dashboard\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\Payment;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $user = $request->user();

        $doctorId = null;
        if ($user && $user->isDoctor()) {
            $doctorId = $user->id;
        } elseif ($request->filled('doctor_id')) {
            $doctorId = $request->integer('doctor_id');
        }

        $visitsQuery = Visit::with(['patient', 'doctor.doctorProfile'])
            ->whereDate('visit_date', $today);

        if ($doctorId) {
            $visitsQuery->where('doctor_id', $doctorId);
        }

        $todayVisits = (clone $visitsQuery)->orderBy('serial_number')->get();

        $stats = [
            'total_visits' => $todayVisits->count(),
            'waiting' => $todayVisits->where('status', 'waiting')->count(),
            'in_consultation' => $todayVisits->where('status', 'in_consultation')->count(),
            'completed' => $todayVisits->where('status', 'completed')->count(),
            'cancelled' => $todayVisits->where('status', 'cancelled')->count(),
            'today_visit_revenue' => Payment::whereDate('payment_date', $today)->where('payment_type', 'visit')->sum('final_paid_amount'),
            'today_treatment_revenue' => Payment::whereDate('payment_date', $today)->where('payment_type', 'treatment')->sum('final_paid_amount'),
            'pending_follow_ups_count' => FollowUp::where('status', 'pending')->whereDate('follow_up_date', '<=', Carbon::tomorrow()->toDateString())->count(),
        ];

        $doctors = User::with('doctorProfile')->where('role', 'doctor')->get();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'todayVisits' => $todayVisits,
            'doctors' => $doctors,
            'selectedDoctorId' => $doctorId,
        ]);
    }
}

