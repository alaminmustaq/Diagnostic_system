<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_code',
        'name',
        'phone',
        'role',
        'password',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function doctorProfile(): HasOne
    {
        return $this->hasOne(DoctorProfile::class, 'user_id');
    }

    public function patientVisits(): HasMany
    {
        return $this->hasMany(Visit::class, 'patient_id');
    }

    public function doctorVisits(): HasMany
    {
        return $this->hasMany(Visit::class, 'doctor_id');
    }

    public function patientTreatments(): HasMany
    {
        return $this->hasMany(PatientTreatment::class, 'patient_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'patient_id');
    }

    public function collectedPayments(): HasMany
    {
        return $this->hasMany(Payment::class, 'collected_by');
    }

    public function patientFollowUps(): HasMany
    {
        return $this->hasMany(FollowUp::class, 'patient_id');
    }

    public function doctorFollowUps(): HasMany
    {
        return $this->hasMany(FollowUp::class, 'doctor_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isDoctor(): bool
    {
        return $this->role === 'doctor';
    }

    public function isPatient(): bool
    {
        return $this->role === 'patient';
    }

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if ($user->role === 'patient' && empty($user->user_code)) {
                $user->user_code = static::generatePatientCode();
            }
        });
    }

    public static function generatePatientCode(): string
    {
        $highest = static::where('role', 'patient')
            ->whereNotNull('user_code')
            ->get(['user_code'])
            ->map(function ($u) {
                if (preg_match('/^PT-(\d+)$/', (string) $u->user_code, $matches)) {
                    return (int) $matches[1];
                }
                return 0;
            })
            ->max() ?? 0;

        $nextNum = max($highest + 1, (static::where('role', 'patient')->count() + 1));
        $candidate = 'PT-' . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);

        while (static::where('user_code', $candidate)->exists()) {
            $nextNum++;
            $candidate = 'PT-' . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }
}
