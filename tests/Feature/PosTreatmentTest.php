<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosTreatmentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Treatment $treatment1;
    private Treatment $treatment2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Reception Admin',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => 'secret123',
        ]);

        $cat = TreatmentCategory::create([
            'name' => 'Laser',
            'ordering' => 1,
            'is_active' => true,
        ]);

        $this->treatment1 = Treatment::create([
            'category_id' => $cat->id,
            'name' => 'Fractional Laser',
            'price' => '3000.00',
            'ordering' => 1,
            'is_active' => true,
        ]);

        $this->treatment2 = Treatment::create([
            'category_id' => $cat->id,
            'name' => 'HydraFacial',
            'price' => '2000.00',
            'ordering' => 2,
            'is_active' => true,
        ]);
    }

    public function test_can_process_treatment_pos_with_discount_and_record_ledger(): void
    {
        $today = Carbon::today()->toDateString();
        $datePart = Carbon::parse($today)->format('dmy');
        $expectedToken = "TRT-{$datePart}-001";

        $response = $this->actingAs($this->admin)->post('/pos/store', [
            'phone' => '01788888888',
            'name' => 'Aesthetic Patient',
            'treatment_ids' => [$this->treatment1->id, $this->treatment2->id],
            'base_amount' => '5000.00',
            'discount_type' => 'fixed',
            'discount_amount' => '500.00',
            'final_paid_amount' => '4500.00',
            'payment_date' => $today,
        ]);

        $response->assertRedirect('/pos');
        $response->assertSessionHas('last_invoice', function ($invoice) use ($expectedToken) {
            return isset($invoice['token_number']) && $invoice['token_number'] === $expectedToken;
        });

        $patient = User::where('phone', '01788888888')->first();
        $this->assertNotNull($patient);
        $this->assertNotNull($patient->user_code);
        $this->assertStringStartsWith('PT-', $patient->user_code);

        // Assert patient_treatments created for both treatments with token and waiting status
        $this->assertDatabaseHas('patient_treatments', [
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => $expectedToken,
            'serial_number' => 1,
            'status' => 'waiting',
            'date_administered' => $today,
        ]);
        $this->assertDatabaseHas('patient_treatments', [
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment2->id,
            'token_number' => $expectedToken,
            'serial_number' => 1,
            'status' => 'waiting',
            'date_administered' => $today,
        ]);

        // Assert payments ledger created with type 'treatment'
        $this->assertDatabaseHas('payments', [
            'patient_id' => $patient->id,
            'payment_type' => 'treatment',
            'base_amount' => '5000.00',
            'discount_type' => 'fixed',
            'discount_amount' => '500.00',
            'final_paid_amount' => '4500.00',
            'payment_date' => $today,
        ]);

        // Second patient booking should increment token serial to 002
        $this->actingAs($this->admin)->post('/pos/store', [
            'phone' => '01799999999',
            'name' => 'Second Patient',
            'treatment_ids' => [$this->treatment1->id],
            'base_amount' => '3000.00',
            'final_paid_amount' => '3000.00',
            'payment_date' => $today,
        ]);

        $this->assertDatabaseHas('patient_treatments', [
            'serial_number' => 2,
            'token_number' => "TRT-{$datePart}-002",
            'status' => 'waiting',
        ]);
    }

    public function test_pos_treatment_supports_bank_and_mobile_banking_with_invoices(): void
    {
        $today = Carbon::today()->toDateString();

        $bankAccount = \App\Models\BankAccount::create([
            'type' => 'bank',
            'bank_name' => 'BRAC Bank',
            'account_name' => 'Laser Unit',
            'account_number' => '4433221100',
            'is_active' => true,
        ]);

        $mobileAccount = \App\Models\BankAccount::create([
            'type' => 'mobile_banking',
            'bank_name' => 'Nagad',
            'account_name' => 'Nagad Merchant',
            'account_number' => '01811223344',
            'account_type' => 'Merchant',
            'is_active' => true,
        ]);

        // 1. Bank Payment for Treatment
        $res1 = $this->actingAs($this->admin)->post('/pos/store', [
            'phone' => '01712001122',
            'name' => 'Bank Treatment Patient',
            'treatment_ids' => [$this->treatment1->id],
            'base_amount' => '3000.00',
            'final_paid_amount' => '3000.00',
            'payment_method' => 'bank',
            'bank_account_id' => $bankAccount->id,
            'payment_date' => $today,
        ]);

        $res1->assertRedirect('/pos');
        $payment1 = Payment::where('payment_method', 'bank')->latest('id')->firstOrFail();
        $this->assertNotNull($payment1->invoice_number);
        $this->assertStringStartsWith('INV-TRT-', $payment1->invoice_number);
        $this->assertEquals($bankAccount->id, $payment1->bank_account_id);
        $this->assertEquals('treatment', $payment1->payment_type);

        $this->assertDatabaseHas('patient_treatments', [
            'payment_id' => $payment1->id,
            'invoice_number' => $payment1->invoice_number,
        ]);

        // 2. Mobile Banking Payment for Treatment
        $res2 = $this->actingAs($this->admin)->post('/pos/store', [
            'phone' => '01712003344',
            'name' => 'Mobile Treatment Patient',
            'treatment_ids' => [$this->treatment2->id],
            'base_amount' => '2000.00',
            'final_paid_amount' => '2000.00',
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobileAccount->id,
            'payment_date' => $today,
        ]);

        $res2->assertRedirect('/pos');
        $payment2 = Payment::where('payment_method', 'mobile_banking')->latest('id')->firstOrFail();
        $this->assertNotNull($payment2->invoice_number);
        $this->assertStringStartsWith('INV-TRT-', $payment2->invoice_number);
        $this->assertEquals($mobileAccount->id, $payment2->bank_account_id);
        $this->assertEquals('treatment', $payment2->payment_type);

        $this->assertDatabaseHas('patient_treatments', [
            'payment_id' => $payment2->id,
            'invoice_number' => $payment2->invoice_number,
        ]);
    }

    public function test_pos_treatment_supports_multi_split_payment_across_multiple_accounts(): void
    {
        $today = Carbon::today()->toDateString();

        $bank1 = \App\Models\BankAccount::create([
            'type' => 'bank',
            'bank_name' => 'BRAC Bank',
            'account_name' => 'General Account',
            'account_number' => '555666777',
            'is_active' => true,
        ]);

        $bank2 = \App\Models\BankAccount::create([
            'type' => 'bank',
            'bank_name' => 'City Bank',
            'account_name' => 'Special Deposit',
            'account_number' => '888999000',
            'is_active' => true,
        ]);

        $mobile1 = \App\Models\BankAccount::create([
            'type' => 'mobile_banking',
            'bank_name' => 'bKash',
            'account_name' => 'Laser bKash',
            'account_number' => '01711000111',
            'account_type' => 'Merchant',
            'is_active' => true,
        ]);

        $mobile2 = \App\Models\BankAccount::create([
            'type' => 'mobile_banking',
            'bank_name' => 'Nagad',
            'account_name' => 'Laser Nagad',
            'account_number' => '01811000222',
            'account_type' => 'Personal',
            'is_active' => true,
        ]);

        // Total 5000 Tk: 2000 Cash, 1500 Bank 1, 500 Bank 2, 500 Mobile 1, 500 Mobile 2
        $response = $this->actingAs($this->admin)->post('/pos/store', [
            'phone' => '01799881122',
            'name' => 'Multi Split POS Patient',
            'treatment_ids' => [$this->treatment1->id, $this->treatment2->id],
            'base_amount' => '5000.00',
            'final_paid_amount' => '5000.00',
            'payment_date' => $today,
            'payment_splits' => [
                ['payment_method' => 'cash', 'amount' => '2000.00'],
                ['payment_method' => 'bank', 'bank_account_id' => $bank1->id, 'amount' => '1500.00'],
                ['payment_method' => 'bank', 'bank_account_id' => $bank2->id, 'amount' => '500.00'],
                ['payment_method' => 'mobile_banking', 'bank_account_id' => $mobile1->id, 'amount' => '500.00'],
                ['payment_method' => 'mobile_banking', 'bank_account_id' => $mobile2->id, 'amount' => '500.00'],
            ],
        ]);

        $response->assertRedirect('/pos');
        $payment = Payment::with('splits')->where('payment_method', 'multiple')->latest('id')->firstOrFail();
        $this->assertEquals('treatment', $payment->payment_type);
        $this->assertEquals('5000.00', $payment->final_paid_amount);
        $this->assertCount(5, $payment->splits);

        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'cash',
            'bank_account_id' => null,
            'amount' => '2000.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'bank',
            'bank_account_id' => $bank1->id,
            'amount' => '1500.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'bank',
            'bank_account_id' => $bank2->id,
            'amount' => '500.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobile1->id,
            'amount' => '500.00',
        ]);
        $this->assertDatabaseHas('payment_splits', [
            'payment_id' => $payment->id,
            'payment_method' => 'mobile_banking',
            'bank_account_id' => $mobile2->id,
            'amount' => '500.00',
        ]);
    }

    public function test_can_update_patient_treatment_record_via_pos_route(): void
    {
        $patient = User::create([
            'name' => 'Test Patient',
            'phone' => '01711112233',
            'role' => 'patient',
            'password' => 'secret123',
        ]);

        $record = \App\Models\PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => 'TRT-010126-001',
            'serial_number' => 1,
            'status' => 'waiting',
            'date_administered' => '2026-01-01',
        ]);

        $response = $this->actingAs($this->admin)->put("/pos/patient-treatments/{$record->id}", [
            'treatment_id' => $this->treatment2->id,
            'status' => 'in_collection',
            'date_administered' => '2026-01-02',
        ]);

        $response->assertRedirect();
        $record->refresh();
        $this->assertEquals($this->treatment2->id, $record->treatment_id);
        $this->assertEquals('in_collection', $record->status);
        $this->assertEquals('2026-01-02', $record->date_administered->toDateString());
    }

    public function test_can_delete_patient_treatment_record_via_pos_route(): void
    {
        $patient = User::create([
            'name' => 'Delete Test Patient',
            'phone' => '01711112234',
            'role' => 'patient',
            'password' => 'secret123',
        ]);

        $record = \App\Models\PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => 'TRT-010126-002',
            'serial_number' => 2,
            'status' => 'waiting',
            'date_administered' => '2026-01-01',
        ]);

        $response = $this->actingAs($this->admin)->delete("/pos/patient-treatments/{$record->id}");

        $response->assertRedirect();
        $this->assertSoftDeleted('patient_treatments', ['id' => $record->id]);
    }

    public function test_can_update_and_delete_patient_treatment_via_consultation_routes(): void
    {
        $patient = User::create([
            'name' => 'Queue Patient',
            'phone' => '01711112235',
            'role' => 'patient',
            'password' => 'secret123',
        ]);

        $record = \App\Models\PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => 'TRT-010126-003',
            'serial_number' => 3,
            'status' => 'waiting',
            'date_administered' => '2026-01-01',
        ]);

        // Update via consultation route
        $updateRes = $this->actingAs($this->admin)->put("/consultation/treatments/{$record->id}", [
            'treatment_id' => $this->treatment2->id,
            'status' => 'sample',
            'date_administered' => '2026-01-03',
        ]);

        $updateRes->assertRedirect();
        $record->refresh();
        $this->assertEquals($this->treatment2->id, $record->treatment_id);
        $this->assertEquals('sample', $record->status);
        $this->assertEquals('2026-01-03', $record->date_administered->toDateString());

        // Delete via consultation route
        $deleteRes = $this->actingAs($this->admin)->delete("/consultation/treatments/{$record->id}");
        $deleteRes->assertRedirect();
        $this->assertSoftDeleted('patient_treatments', ['id' => $record->id]);
    }

    public function test_unauthorized_user_cannot_update_or_delete_patient_treatments(): void
    {
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);

        // Create a user with a restricted role that has NO update/delete pos treatment permissions
        $guestStaff = User::create([
            'name' => 'Doctor Rafiq',
            'phone' => '01899999999',
            'role' => 'doctor',
            'password' => 'secret123',
        ]);
        $guestStaff->assignRole('Doctor'); // Doctor only has view permissions, not delete or edit pos-treatment

        $patient = User::create([
            'name' => 'Auth Test Patient',
            'phone' => '01711112236',
            'role' => 'patient',
            'password' => 'secret123',
        ]);

        $record = \App\Models\PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => 'TRT-010126-004',
            'serial_number' => 4,
            'status' => 'waiting',
            'date_administered' => '2026-01-01',
        ]);

        // Attempt update without permission -> 403
        $this->actingAs($guestStaff)
            ->put("/pos/patient-treatments/{$record->id}", [
                'treatment_id' => $this->treatment2->id,
                'status' => 'sample',
                'date_administered' => '2026-01-01',
            ])
            ->assertStatus(403);

        // Attempt delete without permission -> 403
        $this->actingAs($guestStaff)
            ->delete("/pos/patient-treatments/{$record->id}")
            ->assertStatus(403);
    }

    public function test_can_view_dedicated_patient_treatments_page_with_stats_and_filters(): void
    {
        $patient = User::create([
            'name' => 'Log Patient',
            'phone' => '01711112237',
            'role' => 'patient',
            'password' => 'secret123',
        ]);

        \App\Models\PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => 'TRT-010126-005',
            'serial_number' => 5,
            'status' => 'waiting',
            'date_administered' => '2026-01-01',
        ]);

        $response = $this->actingAs($this->admin)->get('/patient-treatments');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('PatientTreatments/Index')
            ->has('patientTreatments')
            ->has('allTreatments')
            ->has('stats')
            ->has('filters')
        );
    }

    public function test_can_update_and_delete_via_dedicated_patient_treatments_routes(): void
    {
        $patient = User::create([
            'name' => 'Route Patient',
            'phone' => '01711112238',
            'role' => 'patient',
            'password' => 'secret123',
        ]);

        $record = \App\Models\PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'token_number' => 'TRT-010126-006',
            'serial_number' => 6,
            'status' => 'waiting',
            'date_administered' => '2026-01-01',
        ]);

        // Update via dedicated route
        $updateRes = $this->actingAs($this->admin)->put("/patient-treatments/{$record->id}", [
            'treatment_id' => $this->treatment2->id,
            'status' => 'in_collection',
            'date_administered' => '2026-01-04',
        ]);
        $updateRes->assertRedirect();
        $record->refresh();
        $this->assertEquals($this->treatment2->id, $record->treatment_id);
        $this->assertEquals('in_collection', $record->status);
        $this->assertEquals('2026-01-04', $record->date_administered->toDateString());

        // Delete via dedicated route
        $delRes = $this->actingAs($this->admin)->delete("/patient-treatments/{$record->id}");
        $delRes->assertRedirect();
        $this->assertSoftDeleted('patient_treatments', ['id' => $record->id]);
    }
}

