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

    public function test_follow_up_page_filters_by_date_range_from_and_to_date(): void
    {
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();
        $nextWeek = Carbon::today()->addDays(7)->toDateString();

        $fu1 = FollowUp::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => $today,
            'status' => 'pending',
            'is_notified' => false,
        ]);

        $fu2 = FollowUp::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => $tomorrow,
            'status' => 'pending',
            'is_notified' => false,
        ]);

        $fu3 = FollowUp::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => $nextWeek,
            'status' => 'pending',
            'is_notified' => false,
        ]);

        // Filter exact range: today to tomorrow
        $response = $this->actingAs($this->admin)->get("/follow-ups?from_date={$today}&to_date={$tomorrow}");
        $response->assertStatus(200);

        $props = $response->viewData('page')['props'];
        $followUpIds = collect($props['followUps'])->pluck('id')->all();

        $this->assertContains($fu1->id, $followUpIds);
        $this->assertContains($fu2->id, $followUpIds);
        $this->assertNotContains($fu3->id, $followUpIds);

        // Filter from next week onwards
        $responseNextWeek = $this->actingAs($this->admin)->get("/follow-ups?from_date={$nextWeek}");
        $responseNextWeek->assertStatus(200);

        $nextWeekIds = collect($responseNextWeek->viewData('page')['props']['followUps'])->pluck('id')->all();
        $this->assertContains($fu3->id, $nextWeekIds);
        $this->assertNotContains($fu1->id, $nextWeekIds);
        $this->assertNotContains($fu2->id, $nextWeekIds);
    }

    public function test_follow_up_page_filters_by_patient_search(): void
    {
        $patientA = User::create([
            'name' => 'Nazmul Huda',
            'phone' => '01711223344',
            'role' => 'patient',
            'user_code' => 'PT-5001',
        ]);

        $patientB = User::create([
            'name' => 'Sultana Razia',
            'phone' => '01899887766',
            'role' => 'patient',
            'user_code' => 'PT-5002',
        ]);

        $today = Carbon::today()->toDateString();

        $fuA = FollowUp::create([
            'patient_id' => $patientA->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => $today,
            'status' => 'pending',
            'is_notified' => false,
        ]);

        $fuB = FollowUp::create([
            'patient_id' => $patientB->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => $today,
            'status' => 'pending',
            'is_notified' => false,
        ]);

        // Search by name "Nazmul"
        $respName = $this->actingAs($this->admin)->get('/follow-ups?patient_search=Nazmul');
        $respName->assertStatus(200);
        $idsName = collect($respName->viewData('page')['props']['followUps'])->pluck('id')->all();
        $this->assertContains($fuA->id, $idsName);
        $this->assertNotContains($fuB->id, $idsName);

        // Search by phone "0189988"
        $respPhone = $this->actingAs($this->admin)->get('/follow-ups?patient_search=0189988');
        $respPhone->assertStatus(200);
        $idsPhone = collect($respPhone->viewData('page')['props']['followUps'])->pluck('id')->all();
        $this->assertContains($fuB->id, $idsPhone);
        $this->assertNotContains($fuA->id, $idsPhone);

        // Search by user_code "PT-5001"
        $respCode = $this->actingAs($this->admin)->get('/follow-ups?patient_search=PT-5001');
        $respCode->assertStatus(200);
        $idsCode = collect($respCode->viewData('page')['props']['followUps'])->pluck('id')->all();
        $this->assertContains($fuA->id, $idsCode);
        $this->assertNotContains($fuB->id, $idsCode);
    }
}

