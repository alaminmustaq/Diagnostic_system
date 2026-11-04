<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 15 System Modules covering all pages
        $modules = [
            'dashboard' => 'Dashboard Overview',
            'booking' => 'Serial Booking',
            'consultation-queue' => 'Queue Board',
            'consultation-room' => 'Doctor Consultation Room',
            'pos-treatment' => 'Treatment POS & Billing',
            'patient-treatments' => 'Patient Treatments Records',
            'follow-ups' => 'Follow-Ups (WhatsApp)',
            'reports' => 'Reports & Financial Analytics',
            'doctors' => 'Doctor Setup',
            'rooms' => 'Room Setup',
            'treatments' => 'Treatments Catalog & Categories',
            'banks' => 'Bank Setup',
            'mobile-banking' => 'Mobile Banking Setup',
            'company-settings' => 'Company Setup',
            'configuration-settings' => 'Configuration Settings',
            'roles-permissions' => 'Roles & Permissions',
        ];

        $actions = ['view', 'create', 'edit', 'update', 'delete'];

        $allPermissionNames = [];

        foreach ($modules as $moduleKey => $moduleLabel) {
            foreach ($actions as $action) {
                $permissionName = "{$action}-{$moduleKey}";
                Permission::firstOrCreate([
                    'name' => $permissionName,
                    'guard_name' => 'web',
                ]);
                $allPermissionNames[] = $permissionName;
            }
        }

        // Granular Operational & Workflow Permissions
        $operationalPermissions = [
            'call-patient',
            'cancel-serial',
            'in-collection',
            'sample',
            'whatsapp-followup',
        ];

        foreach ($operationalPermissions as $opPerm) {
            Permission::firstOrCreate([
                'name' => $opPerm,
                'guard_name' => 'web',
            ]);
            $allPermissionNames[] = $opPerm;
        }

        // Create Roles and assign permissions
        // 1. Super Admin (Full access to all permissions)
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdminRole->syncPermissions($allPermissionNames);

        // 2. Admin (Full access)
        $adminRole = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $adminRole->syncPermissions($allPermissionNames);

        // 3. Doctor (Consultations, queue, medical rooms, viewing schedules and reports)
        $doctorRole = Role::firstOrCreate(['name' => 'Doctor', 'guard_name' => 'web']);
        $doctorRole->syncPermissions([
            'view-dashboard',
            'view-consultation-queue',
            'edit-consultation-queue',
            'update-consultation-queue',
            'view-consultation-room',
            'create-consultation-room',
            'edit-consultation-room',
            'update-consultation-room',
            'view-booking',
            'view-pos-treatment',
            'view-patient-treatments',
            'view-follow-ups',
            'view-reports',
            'view-doctors',
            'view-rooms',
            'view-treatments',
            'call-patient',
            'cancel-serial',
            'whatsapp-followup',
        ]);

        // 4. Receptionist (Serial booking, token issuance, queue flow, POS payments, follow-ups)
        $receptionistRole = Role::firstOrCreate(['name' => 'Receptionist', 'guard_name' => 'web']);
        $receptionistRole->syncPermissions([
            'view-dashboard',
            'view-booking',
            'create-booking',
            'edit-booking',
            'update-booking',
            'delete-booking',
            'view-consultation-queue',
            'edit-consultation-queue',
            'update-consultation-queue',
            'delete-consultation-queue',
            'view-pos-treatment',
            'create-pos-treatment',
            'edit-pos-treatment',
            'update-pos-treatment',
            'delete-pos-treatment',
            'view-patient-treatments',
            'create-patient-treatments',
            'edit-patient-treatments',
            'update-patient-treatments',
            'delete-patient-treatments',
            'view-follow-ups',
            'create-follow-ups',
            'edit-follow-ups',
            'update-follow-ups',
            'view-reports',
            'view-doctors',
            'view-rooms',
            'view-treatments',
            'view-banks',
            'view-mobile-banking',
            'call-patient',
            'cancel-serial',
            'in-collection',
            'sample',
            'whatsapp-followup',
        ]);

        // 5. Nurse / Clinic Staff (Queue assistance, treatment administration, room viewing)
        $nurseRole = Role::firstOrCreate(['name' => 'Nurse', 'guard_name' => 'web']);
        $nurseRole->syncPermissions([
            'view-dashboard',
            'view-consultation-queue',
            'edit-consultation-queue',
            'update-consultation-queue',
            'view-pos-treatment',
            'edit-pos-treatment',
            'update-pos-treatment',
            'view-patient-treatments',
            'edit-patient-treatments',
            'update-patient-treatments',
            'view-follow-ups',
            'view-rooms',
            'view-treatments',
            'call-patient',
            'in-collection',
            'sample',
        ]);

        // 6. Accountant / Cashier (POS billing, reports, banks and mobile banking management)
        $accountantRole = Role::firstOrCreate(['name' => 'Accountant', 'guard_name' => 'web']);
        $accountantRole->syncPermissions([
            'view-dashboard',
            'view-pos-treatment',
            'create-pos-treatment',
            'view-reports',
            'view-banks',
            'create-banks',
            'edit-banks',
            'update-banks',
            'view-mobile-banking',
            'create-mobile-banking',
            'edit-mobile-banking',
            'update-mobile-banking',
        ]);

        // Assign roles to existing users based on their user type role column if not already assigned
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $adminUser) {
            if ($adminUser->roles()->count() === 0) {
                $adminUser->assignRole('Super Admin');
            }
        }

        $doctors = User::where('role', 'doctor')->get();
        foreach ($doctors as $doctorUser) {
            if ($doctorUser->roles()->count() === 0) {
                $doctorUser->assignRole('Doctor');
            }
        }
    }
}
