<?php

namespace App\Modules\SystemSetup\Controllers;

use App\Http\Controllers\Controller;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DoctorSetupController extends Controller
{
    public function index(): Response
    {
        $doctors = User::with('doctorProfile')
            ->where('role', 'doctor')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('SystemSetup/Doctors', [
            'doctors' => $doctors,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // User identity
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:6'],

            // Doctor Profile
            'designation' => ['required', 'string', 'max:255'],
            'degrees' => ['required', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:50'],
            'professional_phone' => ['nullable', 'string', 'max:20'],
            'bio_summary' => ['nullable', 'string'],
            'default_visit_rate' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'role' => 'doctor',
                'password' => Hash::make($validated['password']),
            ]);

            DoctorProfile::create([
                'user_id' => $user->id,
                'designation' => $validated['designation'],
                'degrees' => $validated['degrees'],
                'room_number' => $validated['room_number'],
                'professional_phone' => $validated['professional_phone'] ?? null,
                'bio_summary' => $validated['bio_summary'] ?? null,
                'default_visit_rate' => $validated['default_visit_rate'],
            ]);
        });

        return redirect()->route('admin.doctors.index')->with('success', 'Doctor registered successfully!');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $doctorUser = User::where('role', 'doctor')->findOrFail($id);

        $validated = $request->validate([
            // User identity
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($doctorUser->id)],
            'password' => ['nullable', 'string', 'min:6'],

            // Doctor Profile
            'designation' => ['required', 'string', 'max:255'],
            'degrees' => ['required', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:50'],
            'professional_phone' => ['nullable', 'string', 'max:20'],
            'bio_summary' => ['nullable', 'string'],
            'default_visit_rate' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($doctorUser, $validated) {
            $userData = [
                'name' => $validated['name'],
                'phone' => $validated['phone'],
            ];

            if (! empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }

            $doctorUser->update($userData);

            DoctorProfile::updateOrCreate(
                ['user_id' => $doctorUser->id],
                [
                    'designation' => $validated['designation'],
                    'degrees' => $validated['degrees'],
                    'room_number' => $validated['room_number'],
                    'professional_phone' => $validated['professional_phone'] ?? null,
                    'bio_summary' => $validated['bio_summary'] ?? null,
                    'default_visit_rate' => $validated['default_visit_rate'],
                ]
            );
        });

        return redirect()->route('admin.doctors.index')->with('success', 'Doctor profile updated successfully!');
    }

    public function destroy(int $id): RedirectResponse
    {
        $doctorUser = User::where('role', 'doctor')->findOrFail($id);
        $doctorUser->delete(); // Soft delete

        return redirect()->route('admin.doctors.index')->with('success', 'Doctor removed successfully.');
    }
}

