<?php

namespace Tests\Feature;

use App\Models\FollowUp;
use App\Models\PatientTreatment;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use App\Models\User;
use App\Models\Visit;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $doctor;
    private User $receptionist;

    protected function setUp(): void
    {
        parent::setUp();

        // Run RolePermissionSeeder
        $this->seed(RolePermissionSeeder::class);

        $this->admin = User::create([
            'name' => 'Super Administrator',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
        $this->admin->assignRole('Super Admin');

        $this->doctor = User::create([
            'name' => 'Dr. Rafiq',
            'phone' => '01800000000',
            'role' => 'doctor',
            'password' => 'secret123',
        ]);
        $this->doctor->assignRole('Doctor');

        // Receptionist staff (user type in users table is 'admin' or staff, but Spatie role is 'Receptionist')
        $this->receptionist = User::create([
            'name' => 'Receptionist User',
            'phone' => '01711223344',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
        $this->receptionist->assignRole('Receptionist');
    }

    public function test_seeder_creates_all_view_create_update_delete_permissions_across_all_modules(): void
    {
        $modules = [
            'dashboard',
            'booking',
            'consultation-queue',
            'consultation-room',
            'pos-treatment',
            'follow-ups',
            'reports',
            'doctors',
            'rooms',
            'treatments',
            'banks',
            'mobile-banking',
            'company-settings',
            'configuration-settings',
            'roles-permissions',
        ];

        $actions = ['view', 'create', 'update', 'delete'];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                $permName = "{$action}-{$module}";
                $this->assertDatabaseHas('permissions', [
                    'name' => $permName,
                    'guard_name' => 'web',
                ]);
            }
        }

        $this->assertGreaterThanOrEqual(60, Permission::count());
    }

    public function test_super_admin_role_has_all_permissions_and_preserves_user_type_role_column(): void
    {
        // Assert users table role column remains untouched
        $this->assertEquals('admin', $this->admin->role);
        $this->assertEquals('doctor', $this->doctor->role);

        // Assert Spatie roles
        $this->assertTrue($this->admin->hasRole('Super Admin'));
        $this->assertTrue($this->doctor->hasRole('Doctor'));
        $this->assertTrue($this->receptionist->hasRole('Receptionist'));

        // Super Admin can access all permissions
        $this->assertTrue($this->admin->can('view-dashboard'));
        $this->assertTrue($this->admin->can('delete-doctors'));
        $this->assertTrue($this->admin->can('delete-roles-permissions'));
    }

    public function test_roles_and_permissions_page_can_be_viewed_by_authorized_admin(): void
    {
        $response = $this->actingAs($this->admin)->get('/settings/roles');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Settings/RolesPermissions')
            ->has('roles')
            ->has('modules')
            ->has('users')
        );
    }

    public function test_can_create_new_role_with_custom_permissions(): void
    {
        $response = $this->actingAs($this->admin)->post('/settings/roles', [
            'name' => 'Inventory Staff',
            'permissions' => ['view-dashboard', 'view-treatments', 'view-rooms'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['name' => 'Inventory Staff']);

        $role = Role::findByName('Inventory Staff', 'web');
        $this->assertTrue($role->hasPermissionTo('view-treatments'));
        $this->assertFalse($role->hasPermissionTo('delete-doctors'));
    }

    public function test_can_update_role_permissions(): void
    {
        $role = Role::create(['name' => 'Billing Clerk', 'guard_name' => 'web']);
        $role->syncPermissions(['view-dashboard']);

        $response = $this->actingAs($this->admin)->put("/settings/roles/{$role->id}", [
            'name' => 'Senior Billing Clerk',
            'permissions' => ['view-dashboard', 'view-pos-treatment', 'create-pos-treatment'],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['id' => $role->id, 'name' => 'Senior Billing Clerk']);

        $updatedRole = Role::findById($role->id, 'web');
        $this->assertTrue($updatedRole->hasPermissionTo('create-pos-treatment'));
    }

    public function test_cannot_delete_core_system_roles(): void
    {
        $superAdminRole = Role::findByName('Super Admin', 'web');
        $response = $this->actingAs($this->admin)->delete("/settings/roles/{$superAdminRole->id}");
        $response->assertRedirect();
        $this->assertDatabaseHas('roles', ['id' => $superAdminRole->id]);
    }

    public function test_can_assign_spatie_role_to_user(): void
    {
        $staffUser = User::create([
            'name' => 'Junior Staff',
            'phone' => '01788776655',
            'role' => 'admin',
            'password' => 'secret123',
        ]);

        $response = $this->actingAs($this->admin)->post("/settings/users/{$staffUser->id}/assign-role", [
            'role_name' => 'Doctor',
        ]);

        $response->assertRedirect();
        $this->assertTrue($staffUser->fresh()->hasRole('Doctor'));
        // User type role column remains 'admin'
        $this->assertEquals('admin', $staffUser->fresh()->role);
    }

    public function test_receptionist_cannot_create_or_delete_doctors_or_banks(): void
    {
        // Receptionist user has role='admin' in users table (user type) but Spatie role='Receptionist'
        // Attempting to create doctor without create-doctors permission must return 403 Forbidden
        $createDoctorRes = $this->actingAs($this->receptionist)->post('/admin/doctors', [
            'name' => 'Unauthorized Doctor',
            'phone' => '01899999999',
            'password' => 'secret123',
            'designation' => 'Surgeon',
        ]);
        $createDoctorRes->assertStatus(403);

        // Attempting to delete doctor without delete-doctors permission must return 403 Forbidden
        $deleteDoctorRes = $this->actingAs($this->receptionist)->delete("/admin/doctors/{$this->doctor->id}");
        $deleteDoctorRes->assertStatus(403);

        // Attempting to create a bank without create-banks permission must return 403 Forbidden
        $createBankRes = $this->actingAs($this->receptionist)->post('/finance/banks', [
            'bank_name' => 'Unauthorized Bank',
            'account_name' => 'Hacked',
            'account_number' => '9999999',
        ]);
        $createBankRes->assertStatus(403);
    }

    public function test_receptionist_can_create_serial_bookings_with_create_permission(): void
    {
        // Receptionist has create-booking permission
        $response = $this->actingAs($this->receptionist)->post('/booking/store', [
            'phone' => '01799112233',
            'name' => 'Receptionist Patient',
            'doctor_id' => $this->doctor->id,
            'visit_date' => \Carbon\Carbon::today()->toDateString(),
            'base_amount' => '1000.00',
            'final_paid_amount' => '1000.00',
        ]);

        $response->assertRedirect('/booking');
        $this->assertDatabaseHas('users', ['phone' => '01799112233']);
    }

    public function test_seeder_creates_operational_permissions_and_assigns_to_roles(): void
    {
        $operational = [
            'call-patient',
            'cancel-serial',
            'in-collection',
            'sample',
            'whatsapp-followup',
        ];

        foreach ($operational as $perm) {
            $this->assertDatabaseHas('permissions', ['name' => $perm, 'guard_name' => 'web']);
        }

        $superAdmin = Role::findByName('Super Admin', 'web');
        $doctorRole = Role::findByName('Doctor', 'web');
        $receptionistRole = Role::findByName('Receptionist', 'web');
        $nurseRole = Role::findByName('Nurse', 'web');

        foreach ($operational as $perm) {
            $this->assertTrue($superAdmin->hasPermissionTo($perm));
        }

        $this->assertTrue($doctorRole->hasPermissionTo('call-patient'));
        $this->assertTrue($doctorRole->hasPermissionTo('cancel-serial'));
        $this->assertTrue($doctorRole->hasPermissionTo('whatsapp-followup'));

        $this->assertTrue($receptionistRole->hasPermissionTo('call-patient'));
        $this->assertTrue($receptionistRole->hasPermissionTo('cancel-serial'));
        $this->assertTrue($receptionistRole->hasPermissionTo('in-collection'));
        $this->assertTrue($receptionistRole->hasPermissionTo('sample'));
        $this->assertTrue($receptionistRole->hasPermissionTo('whatsapp-followup'));

        $this->assertTrue($nurseRole->hasPermissionTo('call-patient'));
        $this->assertTrue($nurseRole->hasPermissionTo('in-collection'));
        $this->assertTrue($nurseRole->hasPermissionTo('sample'));
    }

    public function test_call_patient_permission_allows_and_blocks_unauthorized_users(): void
    {
        $patient = User::create(['name' => 'Test P', 'phone' => '01711001100', 'role' => 'patient']);
        $visit = Visit::create([
            'patient_id' => $patient->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => now()->toDateString(),
            'serial_number' => 10,
            'status' => 'waiting',
        ]);

        // Create restricted staff role without call-patient permission
        $restrictedRole = Role::create(['name' => 'Restricted Desk', 'guard_name' => 'web']);
        $restrictedRole->syncPermissions(['view-dashboard', 'view-consultation-queue']);

        $deskUser = User::create([
            'name' => 'Desk Clerk',
            'phone' => '01755667788',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
        $deskUser->assignRole('Restricted Desk');

        // Blocked desk user attempt
        $blockedRes = $this->actingAs($deskUser)->patch("/consultation/visits/{$visit->id}/status", [
            'status' => 'in_consultation',
        ]);
        $blockedRes->assertStatus(403);
        $this->assertEquals('waiting', $visit->fresh()->status);

        // Receptionist has call-patient permission -> succeeds
        $res = $this->actingAs($this->receptionist)->patch("/consultation/visits/{$visit->id}/status", [
            'status' => 'in_consultation',
        ]);
        $res->assertRedirect();
        $this->assertEquals('in_consultation', $visit->fresh()->status);
    }

    public function test_cancel_serial_permission_allows_and_blocks_unauthorized_users(): void
    {
        $patient = User::create(['name' => 'Test P2', 'phone' => '01711001101', 'role' => 'patient']);
        $visit = Visit::create([
            'patient_id' => $patient->id,
            'doctor_id' => $this->doctor->id,
            'visit_date' => now()->toDateString(),
            'serial_number' => 11,
            'status' => 'waiting',
        ]);

        // Role without cancel-serial
        $viewerRole = Role::create(['name' => 'Queue Viewer', 'guard_name' => 'web']);
        $viewerRole->syncPermissions(['view-dashboard', 'view-consultation-queue', 'call-patient']);

        $viewerUser = User::create([
            'name' => 'Viewer Only',
            'phone' => '01755998877',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
        $viewerUser->assignRole('Queue Viewer');

        // Attempting to cancel serial without cancel-serial permission returns 403 Forbidden
        $blockedRes = $this->actingAs($viewerUser)->patch("/consultation/visits/{$visit->id}/status", [
            'status' => 'cancelled',
        ]);
        $blockedRes->assertStatus(403);
        $this->assertEquals('waiting', $visit->fresh()->status);

        // Receptionist has cancel-serial permission -> succeeds
        $allowedRes = $this->actingAs($this->receptionist)->patch("/consultation/visits/{$visit->id}/status", [
            'status' => 'cancelled',
        ]);
        $allowedRes->assertRedirect();
        $this->assertEquals('cancelled', $visit->fresh()->status);
    }

    public function test_in_collection_and_sample_permissions_allow_and_block_unauthorized_users(): void
    {
        $patient = User::create(['name' => 'Test P3', 'phone' => '01711001102', 'role' => 'patient']);
        $cat = TreatmentCategory::create(['name' => 'Derm', 'ordering' => 1]);
        $treatment = Treatment::create(['category_id' => $cat->id, 'name' => 'Laser', 'price' => 2000, 'ordering' => 1]);

        $item = PatientTreatment::create([
            'patient_id' => $patient->id,
            'treatment_id' => $treatment->id,
            'serial_number' => 1,
            'token_number' => 'TRT-TEST-001',
            'status' => 'waiting',
            'date_administered' => now()->toDateString(),
        ]);

        // Role with only view permission
        $viewOnlyRole = Role::create(['name' => 'Lab Observer', 'guard_name' => 'web']);
        $viewOnlyRole->syncPermissions(['view-dashboard', 'view-consultation-queue']);

        $observer = User::create([
            'name' => 'Observer',
            'phone' => '01711335577',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
        $observer->assignRole('Lab Observer');

        // Step 1: Observer cannot advance to in_collection without in-collection permission
        $blocked1 = $this->actingAs($observer)->patch("/consultation/treatments/{$item->id}/status", [
            'status' => 'in_collection',
        ]);
        $blocked1->assertStatus(403);
        $this->assertEquals('waiting', $item->fresh()->status);

        // Receptionist has in-collection permission -> succeeds
        $ok1 = $this->actingAs($this->receptionist)->patch("/consultation/treatments/{$item->id}/status", [
            'status' => 'in_collection',
        ]);
        $ok1->assertRedirect();
        $this->assertEquals('in_collection', $item->fresh()->status);

        // Step 2: Observer cannot advance to sample without sample permission
        $blocked2 = $this->actingAs($observer)->patch("/consultation/treatments/{$item->id}/status", [
            'status' => 'sample',
        ]);
        $blocked2->assertStatus(403);
        $this->assertEquals('in_collection', $item->fresh()->status);

        // Receptionist has sample permission -> succeeds
        $ok2 = $this->actingAs($this->receptionist)->patch("/consultation/treatments/{$item->id}/status", [
            'status' => 'sample',
        ]);
        $ok2->assertRedirect();
        $this->assertEquals('sample', $item->fresh()->status);
    }

    public function test_whatsapp_followup_permission_allows_and_blocks_unauthorized_users(): void
    {
        $patient = User::create(['name' => 'Test P4', 'phone' => '01711001103', 'role' => 'patient']);
        $followUp = FollowUp::create([
            'patient_id' => $patient->id,
            'doctor_id' => $this->doctor->id,
            'follow_up_date' => now()->addDay()->toDateString(),
            'status' => 'pending',
            'is_notified' => false,
        ]);

        // Role without whatsapp-followup permission
        $noWhatsAppRole = Role::create(['name' => 'Offline Desk', 'guard_name' => 'web']);
        $noWhatsAppRole->syncPermissions(['view-dashboard', 'view-follow-ups']);

        $noWhatsAppUser = User::create([
            'name' => 'Offline Staff',
            'phone' => '01722446688',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
        $noWhatsAppUser->assignRole('Offline Desk');

        // Cannot run daily job
        $blockedCron = $this->actingAs($noWhatsAppUser)->post('/follow-ups/run-daily-job', [
            'target_date' => now()->addDay()->toDateString(),
        ]);
        $blockedCron->assertStatus(403);

        // Cannot mark notified
        $blockedNotify = $this->actingAs($noWhatsAppUser)->post("/follow-ups/{$followUp->id}/mark-notified");
        $blockedNotify->assertStatus(403);
        $this->assertFalse((bool) $followUp->fresh()->is_notified);

        // Receptionist has whatsapp-followup permission -> succeeds
        $okNotify = $this->actingAs($this->receptionist)->post("/follow-ups/{$followUp->id}/mark-notified");
        $okNotify->assertRedirect();
        $this->assertTrue((bool) $followUp->fresh()->is_notified);
    }
}

