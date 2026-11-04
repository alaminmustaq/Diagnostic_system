<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Super Admin role and legacy unseeded admin users
        Gate::before(function ($user, $ability) {
            // Super Admin Spatie role has full root access across all abilities
            if ($user->hasRole('Super Admin')) {
                return true;
            }

            // If user has Spatie roles assigned, evaluate strictly via Spatie permissions
            if ($user->roles()->exists()) {
                // Support alias between edit-* and update-*
                if (str_starts_with($ability, 'edit-')) {
                    $updateAbility = 'update-' . substr($ability, 5);
                    if ($user->hasPermissionTo($updateAbility) || $user->hasPermissionTo($ability)) {
                        return true;
                    }
                } elseif (str_starts_with($ability, 'update-')) {
                    $editAbility = 'edit-' . substr($ability, 7);
                    if ($user->hasPermissionTo($editAbility) || $user->hasPermissionTo($ability)) {
                        return true;
                    }
                }

                return null;
            }

            // Fallback ONLY when user has NO Spatie roles assigned (e.g. unseeded unit test cases)
            if ($user->role === 'admin') {
                return true;
            }

            if ($user->role === 'doctor') {
                $doctorAbilities = [
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
                    'view-follow-ups',
                    'edit-follow-ups',
                    'update-follow-ups',
                    'view-reports',
                    'view-doctors',
                    'view-rooms',
                    'view-treatments',
                    'call-patient',
                    'cancel-serial',
                    'in-collection',
                    'sample',
                    'whatsapp-followup',
                ];

                if (in_array($ability, $doctorAbilities, true)) {
                    return true;
                }
            }

            return null;
        });
    }
}
