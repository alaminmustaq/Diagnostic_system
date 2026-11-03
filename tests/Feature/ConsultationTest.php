<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\FollowUp;
use App\Models\PatientTreatment;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsultationTest extends TestCase
{
    use RefreshDatabase;

    private User $doctor;
    private User $patient;
    private Visit $visit;

    protected function setUp(): void
    {
        parent::setUp();
        $this->doctor = User::create([
            'name' => 'Dr. Ariful',
            'phone' => '01800000000',
            'role' => 'doctor',
            'password' => 'secret123',
        ]);

        DoctorProfile::create([
            'user_id' => $this->doctor->id,
            'designation' => 'Trichologist',
            'degrees' => 'MBBS',
            'room_number' => '101',
            'default_visit_rate' => '1000.00',
        ]);

        $this->patient = User::create([
            'name' => 'Consult Patient',
            'phone' => '01777777777',
            'role' => 'patient',
        ]);

        $this->visit = Visit::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->toDateString(),
            'serial_number' => 1,
            'status' => 'waiting',
        ]);
    }

    public function test_can_update_visit_status(): void
    {
        $response = $this->actingAs($this->doctor)->patch("/consultation/visits/{$this->visit->id}/status", [
            'status' => 'in_consultation',
        ]);
        $response->assertRedirect();
        $this->assertEquals('in_consultation', $this->visit->fresh()->status);
    }

    public function test_doctor_room_renders_successfully_with_active_patient_in_consultation(): void
    {
        $this->visit->update(['status' => 'in_consultation']);

        $response = $this->actingAs($this->doctor)->get('/consultation/room');
        $response->assertStatus(200);
    }

    public function test_doctor_can_prescribe_follow_up_and_complete_visit(): void
    {
        $nextVisitDate = Carbon::today()->addDays(14)->toDateString();

        $response = $this->actingAs($this->doctor)->post("/consultation/visits/{$this->visit->id}/prescribe-follow-up", [
            'follow_up_date' => $nextVisitDate,
            'complete_visit' => true,
        ]);

        $response->assertRedirect();

        // Visit should be completed
        $this->assertEquals('completed', $this->visit->fresh()->status);

        // Follow up created with pending status
        $this->assertDatabaseHas('follow_ups', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'source_visit_id' => $this->visit->id,
            'follow_up_date' => $nextVisitDate,
            'status' => 'pending',
            'is_notified' => false,
        ]);
    }

    public function test_queue_page_includes_treatment_queue_and_active_tab(): void
    {
        $cat = TreatmentCategory::create(['name' => 'Skin', 'ordering' => 1]);
        $treatment = Treatment::create([
            'category_id' => $cat->id,
            'name' => 'PRP Therapy',
            'price' => 5000,
            'color' => '#8B5CF6',
            'ordering' => 1,
        ]);

        $patientTreatment = PatientTreatment::create([
            'patient_id' => $this->patient->id,
            'treatment_id' => $treatment->id,
            'serial_number' => 1,
            'token_number' => 'TRT-031126-001',
            'status' => 'waiting',
            'date_administered' => Carbon::today()->toDateString(),
        ]);

        $response = $this->actingAs($this->doctor)->get('/consultation/queue?tab=treatments');
        $response->assertStatus(200);

        $props = $response->viewData('page')['props'];
        $this->assertEquals('treatments', $props['activeTab']);
        $this->assertCount(1, $props['treatmentQueue']);
        $this->assertEquals('TRT-031126-001', $props['treatmentQueue'][0]['token_number']);
        $this->assertEquals('waiting', $props['treatmentQueue'][0]['status']);
        $this->assertEquals('#8B5CF6', $props['treatmentQueue'][0]['treatment']['color']);
    }

    public function test_can_update_treatment_status_from_waiting_to_in_collection_to_sample(): void
    {
        $cat = TreatmentCategory::create(['name' => 'Skin', 'ordering' => 1]);
        $treatment = Treatment::create([
            'category_id' => $cat->id,
            'name' => 'PRP Therapy',
            'price' => 5000,
            'ordering' => 1,
        ]);

        $patientTreatment = PatientTreatment::create([
            'patient_id' => $this->patient->id,
            'treatment_id' => $treatment->id,
            'serial_number' => 1,
            'token_number' => 'TRT-031126-001',
            'status' => 'waiting',
            'date_administered' => Carbon::today()->toDateString(),
        ]);

        // Step 1: waiting -> in_collection
        $response1 = $this->actingAs($this->doctor)->patch("/consultation/treatments/{$patientTreatment->id}/status", [
            'status' => 'in_collection',
        ]);
        $response1->assertRedirect();
        $this->assertEquals('in_collection', $patientTreatment->fresh()->status);

        // Step 2: in_collection -> sample (done)
        $response2 = $this->actingAs($this->doctor)->patch("/consultation/treatments/{$patientTreatment->id}/status", [
            'status' => 'sample',
        ]);
        $response2->assertRedirect();
        $this->assertEquals('sample', $patientTreatment->fresh()->status);

        // Step 3: attempting any further update once sample must be blocked
        $response3 = $this->actingAs($this->doctor)->patch("/consultation/treatments/{$patientTreatment->id}/status", [
            'status' => 'waiting',
        ]);
        $response3->assertRedirect();
        $response3->assertSessionHas('error');
        $this->assertEquals('sample', $patientTreatment->fresh()->status);
    }
}

