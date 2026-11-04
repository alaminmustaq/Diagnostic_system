<?php

namespace App\Modules\Settings\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionController extends Controller
{
    /**
     * Display a listing of roles, permissions grouped by module, and user assignments.
     */
    public function index(): Response
    {
        $modules = [
            'dashboard' => ['label' => 'Dashboard Overview', 'icon' => 'LayoutDashboard'],
            'booking' => ['label' => 'Serial Booking', 'icon' => 'Ticket'],
            'consultation-queue' => ['label' => 'Queue Board', 'icon' => 'Users'],
            'consultation-room' => ['label' => 'Doctor Consultation Room', 'icon' => 'Stethoscope'],
            'pos-treatment' => ['label' => 'Treatment POS & Billing', 'icon' => 'CreditCard'],
            'patient-treatments' => ['label' => 'Patient Treatments Records', 'icon' => 'Activity'],
            'follow-ups' => ['label' => 'Follow-Ups (WhatsApp)', 'icon' => 'MessageCircle'],
            'reports' => ['label' => 'Reports & Financial Analytics', 'icon' => 'BarChart3'],
            'doctors' => ['label' => 'Doctor Setup', 'icon' => 'UserCog'],
            'rooms' => ['label' => 'Room Setup', 'icon' => 'DoorOpen'],
            'treatments' => ['label' => 'Treatments Catalog & Categories', 'icon' => 'Layers'],
            'banks' => ['label' => 'Bank Setup', 'icon' => 'Landmark'],
            'mobile-banking' => ['label' => 'Mobile Banking Setup', 'icon' => 'Smartphone'],
            'company-settings' => ['label' => 'Company Setup', 'icon' => 'Building2'],
            'configuration-settings' => ['label' => 'Configuration Settings', 'icon' => 'Sliders'],
            'roles-permissions' => ['label' => 'Roles & Permissions', 'icon' => 'ShieldCheck'],
        ];

        $actions = ['view', 'create', 'update', 'delete'];

        $allPermissions = Permission::orderBy('name')->get();

        $roles = Role::with(['permissions', 'users:id,name,phone,role'])->get()->map(function (Role $role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions_count' => $role->permissions->count(),
                'permissions' => $role->permissions->pluck('name')->all(),
                'users_count' => $role->users->count(),
                'is_system' => in_array($role->name, ['Super Admin', 'Admin', 'Doctor', 'Receptionist']),
            ];
        });

        // Group permissions by module with all 4 actions
        $modulesWithPermissions = [];
        foreach ($modules as $key => $meta) {
            $perms = [];
            foreach ($actions as $action) {
                $permName = "{$action}-{$key}";
                $perms[$action] = $permName;
            }
            $modulesWithPermissions[] = [
                'key' => $key,
                'label' => $meta['label'],
                'icon' => $meta['icon'],
                'permissions' => $perms,
            ];
        }

        // Users who can have roles assigned (staff, doctors, admins)
        $users = User::whereIn('role', ['admin', 'doctor'])
            ->with('roles')
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'role'])
            ->map(function (User $u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'phone' => $u->phone,
                    'user_type' => $u->role,
                    'current_role' => $u->roles->first()?->name ?? 'None',
                    'role_id' => $u->roles->first()?->id ?? null,
                ];
            });

        $operationalPermissions = [
            [
                'name' => 'call-patient',
                'label' => 'Call Patient',
                'description' => 'Permission to call waiting patient into consultation room from Queue, Dashboard & Doctor Room',
                'badge' => 'Queue & Dashboard',
            ],
            [
                'name' => 'cancel-serial',
                'label' => 'Cancel Serial',
                'description' => 'Permission to cancel an active serial/visit from Queue and Dashboard',
                'badge' => 'Queue & Dashboard',
            ],
            [
                'name' => 'in-collection',
                'label' => 'In Collection',
                'description' => 'Permission to advance treatment progress to In Collection status in Queue and Dashboard',
                'badge' => 'Treatment Queue',
            ],
            [
                'name' => 'sample',
                'label' => 'Sample (Done)',
                'description' => 'Permission to mark treatment as Sample (Done) in Queue and Dashboard',
                'badge' => 'Treatment Queue',
            ],
            [
                'name' => 'whatsapp-followup',
                'label' => 'WhatsApp Follow-Ups & Broadcast',
                'description' => 'Permission to run daily WhatsApp reminder cron and send manual follow-up reminders',
                'badge' => 'Follow-Ups',
            ],
        ];

        return Inertia::render('Settings/RolesPermissions', [
            'roles' => $roles,
            'modules' => $modulesWithPermissions,
            'operationalPermissions' => $operationalPermissions,
            'allPermissions' => $allPermissions->pluck('name'),
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $perms = $validated['permissions'];
            foreach ($perms as $p) {
                if (str_starts_with($p, 'update-')) {
                    $perms[] = 'edit-' . substr($p, 7);
                } elseif (str_starts_with($p, 'edit-')) {
                    $perms[] = 'update-' . substr($p, 5);
                }
            }
            $role->syncPermissions(array_unique($perms));
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "Role '{$role->name}' created successfully with assigned permissions.");
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name,' . $role->id],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        // Protect Super Admin name from being altered
        if ($role->name === 'Super Admin' && $validated['name'] !== 'Super Admin') {
            return redirect()->back()->with('error', 'The Super Admin role name cannot be modified.');
        }

        $role->name = $validated['name'];
        $role->save();

        if ($role->name === 'Super Admin') {
            // Super Admin always maintains all permissions
            $allPerms = Permission::pluck('name')->all();
            $role->syncPermissions($allPerms);
        } else {
            $perms = $validated['permissions'] ?? [];
            foreach ($perms as $p) {
                if (str_starts_with($p, 'update-')) {
                    $perms[] = 'edit-' . substr($p, 7);
                } elseif (str_starts_with($p, 'edit-')) {
                    $perms[] = 'update-' . substr($p, 5);
                }
            }
            $role->syncPermissions(array_unique($perms));
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "Role '{$role->name}' updated successfully.");
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(int $id): RedirectResponse
    {
        $role = Role::findOrFail($id);

        if (in_array($role->name, ['Super Admin', 'Admin', 'Doctor', 'Receptionist'])) {
            return redirect()->back()->with('error', "System core role '{$role->name}' cannot be deleted.");
        }

        $roleName = $role->name;
        $role->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "Role '{$roleName}' deleted successfully.");
    }

    /**
     * Assign a Spatie role to a specific user.
     */
    public function assignUserRole(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'role_name' => ['required', 'string', 'exists:roles,name'],
        ]);

        $user = User::findOrFail($id);
        $user->syncRoles([$validated['role_name']]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "User '{$user->name}' assigned to role '{$validated['role_name']}' successfully.");
    }
}

