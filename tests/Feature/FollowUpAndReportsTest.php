<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\FollowUp;
use App\Models\Payment;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class FollowUpAndReportsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $doctor;
    private User $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Report Admin',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => 'secret123',
        ]);

        $this->doctor = User::create([
            'name' => 'Dr. Farhana',
            'phone' => '01800000000',
            'role' => 'doctor',
            'password' => 'secret123',
        ]);

        DoctorProfile::create([
            'user_id' => $this->doctor->id,
            'designation' => 'Dermatologist',
            'degrees' => 'MBBS',
            'room_number' => '201',
            'default_visit_rate' => '1200.00',
        ]);

        $this->patient = User::create([
            'name' => 'Sample Patient',
            'phone' => '01799999999',
            'role' => 'patient',
        ]);
    }

    public function test_whatsapp_reminder_command_dispatches_and_marks_is_notified(): void
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $followUp = FollowUp::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => $tomorrow,
            'status' => 'pending',
            'is_notified' => false,
        ]);

        // Run artisan command
        Artisan::call('followups:send-reminders', ['--date' => $tomorrow]);

        $this->assertTrue($followUp->fresh()->is_notified);
    }

    public function test_reports_render_all_subtabs_successfully(): void
    {
        // Visit report
        $resVisits = $this->actingAs($this->admin)->get('/reports?tab=visits');
        $resVisits->assertStatus(200);

        // Follow-up report
        $resFollowUps = $this->actingAs($this->admin)->get('/reports?tab=followups');
        $resFollowUps->assertStatus(200);

        // Treatment report
        $resTreatments = $this->actingAs($this->admin)->get('/reports?tab=treatments');
        $resTreatments->assertStatus(200);

        // Payment report
        $resPayments = $this->actingAs($this->admin)->get('/reports?tab=payments');
        $resPayments->assertStatus(200);
    }
}

