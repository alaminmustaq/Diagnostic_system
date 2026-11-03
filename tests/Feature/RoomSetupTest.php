<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoomSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_view_rooms_page(): void
    {
        $user = User::create([
            'name' => 'Test Admin',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);
        Room::create([
            'room_number' => 'Room 101',
            'description' => 'Consultation Room 1',
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get(route('admin.rooms.index'));

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_update_and_delete_room(): void
    {
        $user = User::create([
            'name' => 'Test Admin',
            'phone' => '01700000001',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        // Store
        $storeResponse = $this->actingAs($user)->post(route('admin.rooms.store'), [
            'room_number' => 'Room 202',
            'description' => 'Laser Therapy Room',
            'status' => 'active',
            'is_active' => true,
        ]);

        $storeResponse->assertRedirect(route('admin.rooms.index'));
        $this->assertDatabaseHas('rooms', [
            'room_number' => 'Room 202',
            'description' => 'Laser Therapy Room',
            'status' => 'active',
            'is_active' => 1,
        ]);

        $room = Room::firstOrFail();

        // Update
        $updateResponse = $this->actingAs($user)->put(route('admin.rooms.update', $room->id), [
            'room_number' => 'Room 202-B',
            'description' => 'Updated Laser Room',
            'status' => 'inactive',
            'is_active' => false,
        ]);

        $updateResponse->assertRedirect(route('admin.rooms.index'));
        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'room_number' => 'Room 202-B',
            'description' => 'Updated Laser Room',
            'status' => 'inactive',
            'is_active' => 0,
        ]);

        // Destroy (soft delete)
        $deleteResponse = $this->actingAs($user)->delete(route('admin.rooms.destroy', $room->id));

        $deleteResponse->assertRedirect(route('admin.rooms.index'));
        $this->assertSoftDeleted('rooms', ['id' => $room->id]);
    }

    public function test_doctor_setup_stores_room_id_in_database(): void
    {
        $admin = User::create([
            'name' => 'Test Admin',
            'phone' => '01700000002',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);

        $room = Room::create([
            'room_number' => 'Room 305',
            'description' => 'Dermatology Room',
            'status' => 'active',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->post(route('admin.doctors.store'), [
            'name' => 'Dr. Test Doctor',
            'phone' => '01812345678',
            'password' => 'password123',
            'designation' => 'Consultant',
            'degrees' => 'MBBS',
            'room_id' => $room->id,
            'default_visit_rate' => 1000,
        ]);

        $response->assertRedirect(route('admin.doctors.index'));
        $this->assertDatabaseHas('doctor_profiles', [
            'room_id' => $room->id,
        ]);
    }
}
