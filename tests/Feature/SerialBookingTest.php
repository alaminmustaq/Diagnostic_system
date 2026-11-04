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

        // Code match test: searching by user_code (e.g. PT-0001) returns exact match
        $code = $existing->fresh()->user_code;
        $this->assertNotNull($code);
        $res4 = $this->actingAs($this->admin)->getJson('/booking/search-patient?phone=' . $code);
        $res4->assertStatus(200);
        $res4->assertJson([
            'exists' => true,
            'patient' => [
                'user_code' => $code,
                'phone' => '01711111111',
            ],
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

        // Assert patient created with user_code
        $patient = User::where('phone', '01755555555')->first();
        $this->assertNotNull($patient);
        $this->assertEquals('patient', $patient->role);
        $this->assertNotNull($patient->user_code);
        $this->assertStringStartsWith('PT-', $patient->user_code);

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

        // Patient walks in early and reception books a new serial with consultation fee
        $this->actingAs($this->admin)->post('/booking/store', [
            'phone' => '01766666666',
            'name' => 'Early Returning Patient',
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->toDateString(),
            'base_amount' => '1000.00',
            'discount_type' => null,
            'discount_amount' => '0.00',
            'final_paid_amount' => '1000.00',
        ]);

        // Verify that the pending follow-up was automatically resolved to completed!
        $this->assertEquals('completed', $followUp->fresh()->status);

        // Verify payment was recorded for returning patient
        $this->assertDatabaseHas('payments', [
            'patient_id' => $patient->id,
            'payment_type' => 'visit',
            'final_paid_amount' => '1000.00',
        ]);
    }

    public function test_serial_booking_supports_bank_and_mobile_banking_with_invoices(): void
    {
        $bankAccount = \App\Models\BankAccount::create([
            'type' => 'bank',
            'bank_name' => 'City Bank',
            'account_name' => 'Clinic Collection',
            'account_number' => '9988776655',
            'is_active' => true,
        ]);

        $mobileAccount = \App\Models\BankAccount::create([
            'type' => 'mobile_banking',
            'bank_name' => 'bKash',
            'account_name' => 'Reception bKash',
            'account_number' => '01712345678',
            'account_type' => 'Merchant',
            'is_active' => true,
        ]);

        // 1. Bank Payment
        $this->actingAs($this->admin)->post('/booking/store', [
            'phone' => '01711223344',
            'name' => 'Bank Paying Patient',
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->toDateString(),
            'base_amount' => '1000.00',
            'final_paid_amount' => '1000.00',
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
        ]);

        $visit1 = Visit::where('patient_id', User::where('phone', '01711223344')->value('id'))->firstOrFail();
        $this->assertNotNull($visit1->invoice_number);
        $this->assertStringStartsWith('INV-VIS-', $visit1->invoice_number);
        $this->assertNotNull($visit1->payment_id);

        $this->assertDatabaseHas('payments', [
            'id' => $visit1->payment_id,
            'visit_id' => $visit1->id,
            'invoice_number' => $visit1->invoice_number,
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
            'payment_type' => 'visit',
        ]);

        // 2. Mobile Banking Payment
        $this->actingAs($this->admin)->post('/booking/store', [
            'phone' => '01799887766',
            'name' => 'Mobile Paying Patient',
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->toDateString(),
            'base_amount' => '1000.00',
            'final_paid_amount' => '1000.00',
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobileAccount->id,
        ]);

        $visit2 = Visit::where('patient_id', User::where('phone', '01799887766')->value('id'))->firstOrFail();
        $this->assertNotNull($visit2->invoice_number);
        $this->assertStringStartsWith('INV-VIS-', $visit2->invoice_number);
        $this->assertNotNull($visit2->payment_id);

        $this->assertDatabaseHas('payments', [
            'id' => $visit2->payment_id,
            'visit_id' => $visit2->id,
            'invoice_number' => $visit2->invoice_number,
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobileAccount->id,
            'payment_type' => 'visit',
        ]);
    }

    public function test_serial_booking_supports_multi_split_payment_across_cash_multiple_banks_and_mobile_accounts(): void
    {
        $bank1 = \App\Models\BankAccount::create([
            'type' => 'bank',
            'bank_name' => 'City Bank',
            'account_name' => 'General Account',
            'account_number' => '111222333',
            'is_active' => true,
        ]);

        $bank2 = \App\Models\BankAccount::create([
            'type' => 'bank',
            'bank_name' => 'Eastern Bank',
            'account_name' => 'Special Deposit',
            'account_number' => '444555666',
            'is_active' => true,
        ]);

        $mobile1 = \App\Models\BankAccount::create([
            'type' => 'mobile_banking',
            'bank_name' => 'bKash',
            'account_name' => 'Main Merchant',
            'account_number' => '01700111222',
            'account_type' => 'Merchant',
            'is_active' => true,
        ]);

        $mobile2 = \App\Models\BankAccount::create([
            'type' => 'mobile_banking',
            'bank_name' => 'Nagad',
            'account_name' => 'Secondary Agent',
            'account_number' => '01800333444',
            'account_type' => 'Agent',
            'is_active' => true,
        ]);

        // Total 1000 Tk: 500 Cash, 200 Bank 1, 100 Bank 2, 100 Mobile 1, 100 Mobile 2
        $response = $this->actingAs($this->admin)->post('/booking/store', [
            'phone' => '01712349999',
            'name' => 'Split Pay Patient',
            'doctor_id' => $this->doctor->id,
            'visit_date' => Carbon::today()->toDateString(),
            'base_amount' => '1000.00',
            'final_paid_amount' => '1000.00',
            'payment_splits' => [
                ['payment_method' => 'cash', 'amount' => '500.00'],
                ['payment_method' => 'bank', 'bank_account_id' => $bank1->id, 'amount' => '200.00'],
                ['payment_method' => 'bank', 'bank_account_id' => $bank2->id, 'amount' => '100.00'],
                ['payment_method' => 'mobile_banking', 'bank_account_id' => $mobile1->id, 'amount' => '100.00'],
                ['payment_method' => 'mobile_banking', 'bank_account_id' => $mobile2->id, 'amount' => '100.00'],
            ],
        ]);

        $response->assertRedirect('/booking');

        $visit = Visit::where('patient_id', User::where('phone', '01712349999')->value('id'))->firstOrFail();
        $this->assertNotNull($visit->payment_id);
        $payment = Payment::with('splits')->findOrFail($visit->payment_id);

        $this->assertEquals('multiple', $payment->payment_method);
        $this->assertEquals('1000.00', $payment->final_paid_amount);
        $this->assertCount(5, $payment->splits);

        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'cash',
            'bank_account_id' => null,
            'amount' => '500.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'bank',
            'bank_account_id' => $bank1->id,
            'amount' => '200.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'bank',
            'bank_account_id' => $bank2->id,
            'amount' => '100.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobile1->id,
            'amount' => '100.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobile2->id,
            'amount' => '100.00',
        ]);
    }
}

