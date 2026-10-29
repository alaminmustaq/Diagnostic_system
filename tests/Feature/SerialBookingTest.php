<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\FollowUp;
use App\Models\Payment;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SerialBookingTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $doctor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Admin Staff',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => 'secret123',
        ]);

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
    }

    public function test_phone_search_detects_existing_and_new_patients(): void
    {
        $existing = User::create([
            'name' => 'Existing Patient',
            'phone' => '01711111111',
            'role' => 'patient',
        ]);

        Visit::create([
            'patient_id' => $existing->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::yesterday()->toDateString(),
            'serial_number' => 1,
            'status' => 'completed',
        ]);

        $res1 = $this->actingAs($this->admin)->getJson('/booking/search-patient?phone=01711111111');
        $res1->assertStatus(200);
        $res1->assertJson([
            'exists' => true,
            'has_prior_visits' => true,
            'patient' => [
                'name' => 'Existing Patient',
                'phone' => '01711111111',
            ],
        ]);

        $res2 = $this->actingAs($this->admin)->getJson('/booking/search-patient?phone=01999999999');
        $res2->assertStatus(200);
        $res2->assertJson([
            'exists' => false,
            'has_prior_visits' => false,
        ]);

        // Prefix match test: searching '017' should return existing in matches
        $res3 = $this->actingAs($this->admin)->getJson('/booking/search-patient?phone=017');
        $res3->assertStatus(200);
        $res3->assertJsonFragment([
            'name' => 'Existing Patient',
            'phone' => '01711111111',
            'has_prior_visits' => true,
        ]);
    }

    public function test_booking_new_patient_charges_fee_generates_token_and_records_payment(): void
    {
        $visitDate = Carbon::today()->toDateString();

        $response = $this->actingAs($this->admin)->post('/booking/store', [
            'phone' => '01755555555',
            'name' => 'New Patient User',
            'doctor_id' => $this->doctor->id,
            'visit_date' => $visitDate,
            'base_amount' => '1000.00',
            'discount_type' => 'percentage',
            'discount_amount' => '10.00',
            'final_paid_amount' => '900.00',
        ]);

        $response->assertRedirect('/booking');

        // Assert patient created
        $patient = User::where('phone', '01755555555')->first();
        $this->assertNotNull($patient);
        $this->assertEquals('patient', $patient->role);

        // Assert Visit created with serial 1
        $visit = Visit::where('patient_id', $patient->id)->first();
        $this->assertNotNull($visit);
        $this->assertEquals(1, $visit->serial_number);
        $this->assertEquals('waiting', $visit->status);

        // Token check
        $expectedDate = Carbon::parse($visitDate)->format('dmy');
        $this->assertEquals("{$expectedDate}-001", $visit->token_number);

        // Assert Payment recorded in ledger
        $this->assertDatabaseHas('payments', [
            'patient_id' => $patient->id,
            'payment_type' => 'visit',
            'base_amount' => '1000.00',
            'discount_type' => 'percentage',
            'discount_amount' => '10.00',
            'final_paid_amount' => '900.00',
        ]);
    }

    public function test_smart_auto_resolve_completes_pending_followup_when_serial_booked(): void
    {
        $patient = User::create([
            'name' => 'Early Returning Patient',
            'phone' => '01766666666',
            'role' => 'patient',
        ]);

        // Prior visit
        $pastVisit = Visit::create([
            'patient_id' => $patient->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->subDays(10)->toDateString(),
            'serial_number' => 1,
            'status' => 'completed',
        ]);

        // Pending follow-up scheduled for next week
        $followUp = FollowUp::create([
            'patient_id' => $patient->id,
            'doctor_id' => $this->doctor->id,
            'source_visit_id' => $pastVisit->id,
            'follow_up_date' => Carbon::today()->addDays(7)->toDateString(),
            'status' => 'pending',
            'is_notified' => false,
        ]);

        $this->assertEquals('pending', $followUp->fresh()->status);

        // Patient walks in early and reception books a new serial (Free Visit: 0 fee)
        $this->actingAs($this->admin)->post('/booking/store', [
            'phone' => '01766666666',
            'name' => 'Early Returning Patient',
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->toDateString(),
            'base_amount' => '0.00',
            'discount_type' => null,
            'discount_amount' => '0.00',
            'final_paid_amount' => '0.00',
        ]);

        // Verify that the pending follow-up was automatically resolved to completed!
        $this->assertEquals('completed', $followUp->fresh()->status);
    }
}

