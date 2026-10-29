<?php

namespace App\Modules\FollowUpNotification\Controllers;

use App\Http\Controllers\Controller;
use App\Models\FollowUp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class FollowUpController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $query = FollowUp::with(['patient', 'doctor.doctorProfile', 'sourceVisit']);

        if ($request->filled('doctor_id')) {
            $query->where('doctor_id', $request->integer('doctor_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('date_filter')) {
            $filter = $request->string('date_filter');
            if ($filter === 'today') {
                $query->whereDate('follow_up_date', $today);
            } elseif ($filter === 'tomorrow') {
                $query->whereDate('follow_up_date', $tomorrow);
            } elseif ($filter === 'upcoming_week') {
                $query->whereBetween('follow_up_date', [$today, Carbon::today()->addDays(7)->toDateString()]);
            }
        } elseif ($request->filled('from_date') && $request->filled('to_date')) {
            $query->whereBetween('follow_up_date', [$request->input('from_date'), $request->input('to_date')]);
        }

        $followUps = $query->orderBy('follow_up_date', 'asc')->get();

        $doctors = User::with('doctorProfile')->where('role', 'doctor')->get();

        $summary = [
            'total_pending' => FollowUp::where('status', 'pending')->count(),
            'due_tomorrow_unnotified' => FollowUp::where('status', 'pending')
                ->whereDate('follow_up_date', $tomorrow)
                ->where('is_notified', false)
                ->count(),
            'completed' => FollowUp::where('status', 'completed')->count(),
        ];

        return Inertia::render('FollowUps/Index', [
            'followUps' => $followUps,
            'doctors' => $doctors,
            'summary' => $summary,
            'filters' => $request->only(['doctor_id', 'status', 'date_filter', 'from_date', 'to_date']),
            'today' => $today,
            'tomorrow' => $tomorrow,
        ]);
    }

    public function runDailyJob(Request $request): RedirectResponse
    {
        $targetDate = $request->input('target_date', Carbon::tomorrow()->toDateString());
        
        Artisan::call('followups:send-reminders', [
            '--date' => $targetDate,
        ]);

        $output = Artisan::output();

        return redirect()->back()->with('success', 'Automated WhatsApp job executed: ' . trim($output));
    }

    public function markNotified(int $id): RedirectResponse
    {
        $followUp = FollowUp::findOrFail($id);
        $followUp->update(['is_notified' => true]);

        return redirect()->back()->with('success', 'Follow-up marked as notified via WhatsApp.');
    }

    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,completed,cancelled'],
        ]);

        $followUp = FollowUp::findOrFail($id);
        $followUp->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Follow-up status updated to ' . ucfirst($validated['status']) . '.');
    }
}

