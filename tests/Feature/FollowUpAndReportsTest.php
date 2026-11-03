<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\FollowUp;
use App\Models\PatientTreatment;
use App\Models\Payment;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
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

    public function test_visit_report_filters_by_patient_id(): void
    {
        $patient2 = User::create([
            'name' => 'Other Patient',
            'phone' => '01788888888',
            'role' => 'patient',
        ]);

        $today = Carbon::today()->toDateString();

        Visit::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => $today,
            'serial_number' => 1,
            'status' => 'waiting',
        ]);

        Visit::create([
            'patient_id' => $patient2->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => $today,
            'serial_number' => 2,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->admin)->get('/reports?tab=visits&patient_id=' . $this->patient->id);
        $response->assertStatus(200);

        $reportData = $response->viewData('page')['props']['reportData'];
        $this->assertCount(1, $reportData['records']);
        $this->assertEquals($this->patient->id, $reportData['records'][0]['patient_id']);
    }

    public function test_treatment_report_filters_by_patient_id_and_returns_patient_information(): void
    {
        $patient2 = User::create([
            'name' => 'Second Patient',
            'phone' => '01777777777',
            'role' => 'patient',
        ]);

        $cat = TreatmentCategory::create(['name' => 'Laser', 'ordering' => 1]);
        $treatment = Treatment::create([
            'category_id' => $cat->id,
            'name' => 'HydraFacial',
            'price' => 2000,
            'color' => '#EC4899',
            'ordering' => 1,
        ]);

        $today = Carbon::today()->toDateString();

        PatientTreatment::create([
            'patient_id' => $this->patient->id,
            'treatment_id' => $treatment->id,
            'date_administered' => $today,
        ]);

        PatientTreatment::create([
            'patient_id' => $patient2->id,
            'treatment_id' => $treatment->id,
            'date_administered' => $today,
        ]);

        // Filter by $this->patient->id
        $response = $this->actingAs($this->admin)->get('/reports?tab=treatments&patient_id=' . $this->patient->id);
        $response->assertStatus(200);

        $reportData = $response->viewData('page')['props']['reportData'];
        $this->assertCount(1, $reportData['records']);
        $this->assertEquals($this->patient->id, $reportData['records'][0]['patient_id']);
        $this->assertEquals('Sample Patient', $reportData['records'][0]['patient']['name']);
        $this->assertEquals('HydraFacial', $reportData['records'][0]['treatment']['name']);
        $this->assertEquals('#EC4899', $reportData['records'][0]['treatment']['color']);
    }
}

