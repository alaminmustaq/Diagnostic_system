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

        $patient = User::where('phone', '01788888888')->first();
        $this->assertNotNull($patient);

        // Assert patient_treatments created for both treatments
        $this->assertDatabaseHas('patient_treatments', [
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment1->id,
            'date_administered' => $today,
        ]);
        $this->assertDatabaseHas('patient_treatments', [
            'patient_id' => $patient->id,
            'treatment_id' => $this->treatment2->id,
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
    }
}

