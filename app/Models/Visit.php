<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Visit extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'visit_date',
        'serial_number',
        'status',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'token_number',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'visit_date' => 'date:Y-m-d',
            'serial_number' => 'integer',
        ];
    }

    /**
     * Get dynamic token number formatted like 281026-001 (dmY or dmy-serial).
     */
    protected function tokenNumber(): Attribute
    {
        return Attribute::make(
            get: function (): string {
                $datePart = $this->visit_date ? Carbon::parse($this->visit_date)->format('dmy') : date('dmy');
                $serialPart = str_pad((string) $this->serial_number, 3, '0', STR_PAD_LEFT);
                return "{$datePart}-{$serialPart}";
            }
        );
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(FollowUp::class, 'source_visit_id');
    }
}

