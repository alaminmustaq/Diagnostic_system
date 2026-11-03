<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\Room;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemSetupTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Admin Test',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
    }

    public function test_admin_can_setup_doctor_with_seamless_profile_split(): void
    {
        $room = Room::create([
            'room_number' => 'Room 301',
            'description' => 'Hair Surgery Room',
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->post('/admin/doctors', [
            'name' => 'Dr. Rafiqul Hasan',
            'phone' => '01811223344',
            'password' => 'secret123',
            'designation' => 'Hair Transplant Surgeon',
            'degrees' => 'MBBS, MS',
            'room_id' => $room->id,
            'professional_phone' => '01811223345',
            'bio_summary' => 'Surgeon specialist',
            'default_visit_rate' => '1500.00',
        ]);

        $response->assertRedirect('/admin/doctors');

        $this->assertDatabaseHas('users', [
            'name' => 'Dr. Rafiqul Hasan',
            'phone' => '01811223344',
            'role' => 'doctor',
        ]);

        $doctorUser = User::where('phone', '01811223344')->first();
        $this->assertNotNull($doctorUser);

        $this->assertDatabaseHas('doctor_profiles', [
            'user_id' => $doctorUser->id,
            'room_id' => $room->id,
            'designation' => 'Hair Transplant Surgeon',
            'degrees' => 'MBBS, MS',
            'default_visit_rate' => '1500.00',
        ]);
    }

    public function test_admin_can_manage_treatment_categories_and_treatments(): void
    {
        $room = Room::create([
            'room_number' => 'Room 105',
            'description' => 'Laser Suite',
            'status' => 'active',
            'is_active' => true,
        ]);

        // 1. Create Category
        $catResponse = $this->actingAs($this->admin)->post('/admin/categories', [
            'name' => 'Laser Treatments',
            'ordering' => 1,
            'is_active' => true,
        ]);
        $catResponse->assertRedirect();
        $this->assertDatabaseHas('treatment_categories', ['name' => 'Laser Treatments']);

        $category = TreatmentCategory::first();

        // 2. Create Treatment under Category with Room ID and Color
        $trtResponse = $this->actingAs($this->admin)->post('/admin/treatments', [
            'category_id' => $category->id,
            'room_id' => $room->id,
            'name' => 'CO2 Fractional Laser',
            'price' => '4000.00',
            'ordering' => 1,
            'color' => '#3B82F6',
            'is_active' => true,
        ]);
        $trtResponse->assertRedirect();

        $this->assertDatabaseHas('treatments', [
            'category_id' => $category->id,
            'room_id' => $room->id,
            'name' => 'CO2 Fractional Laser',
            'price' => '4000.00',
            'color' => '#3B82F6',
        ]);

        $treatment = Treatment::first();

        // 3. Update Treatment Color
        $updateResponse = $this->actingAs($this->admin)->put("/admin/treatments/{$treatment->id}", [
            'category_id' => $category->id,
            'room_id' => $room->id,
            'name' => 'CO2 Fractional Laser Updated',
            'price' => '4500.00',
            'ordering' => 2,
            'color' => '#10B981',
            'is_active' => true,
        ]);
        $updateResponse->assertRedirect();

        $this->assertDatabaseHas('treatments', [
            'id' => $treatment->id,
            'color' => '#10B981',
            'price' => '4500.00',
        ]);
    }
}

