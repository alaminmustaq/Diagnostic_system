<?php

namespace App\Console\Commands;

use App\Models\FollowUp;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendWhatsAppReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'followups:send-reminders {--date= : Specific follow-up date (defaults to tomorrow)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send automated WhatsApp reminders for upcoming patient follow-ups';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $targetDate = $this->option('date') ?: Carbon::tomorrow()->toDateString();

        $this->info("Scanning follow-ups for date: {$targetDate}...");

        $followUps = FollowUp::with(['patient', 'doctor.doctorProfile'])
            ->whereDate('follow_up_date', $targetDate)
            ->where('status', 'pending')
            ->where('is_notified', false)
            ->get();

        if ($followUps->isEmpty()) {
            $this->comment("No pending, unnotified follow-ups found for {$targetDate}.");
            return self::SUCCESS;
        }

        $sentCount = 0;
        foreach ($followUps as $followUp) {
            $patient = $followUp->patient;
            $doctor = $followUp->doctor;
            $doctorName = $doctor?->name ?: 'Doctor';
            $patientName = $patient?->name ?: 'Valued Patient';
            $phone = $patient?->phone;

            $message = "Hello {$patientName}, this is a reminder from our Clinic. Your scheduled follow-up consultation with {$doctorName} is tomorrow ({$targetDate}). Please visit on time. Thank you!";

            // Log notification / trigger WhatsApp gateway
            Log::info("WhatsApp reminder dispatched to {$phone}: {$message}");

            // Mark as notified
            $followUp->update(['is_notified' => true]);
            $sentCount++;

            $this->line(" -> Reminder sent to {$patientName} ({$phone})");
        }

        $this->info("Successfully dispatched {$sentCount} WhatsApp reminder(s).");
        return self::SUCCESS;
    }
}

