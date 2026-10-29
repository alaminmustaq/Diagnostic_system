<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FollowUp extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'source_visit_id',
        'follow_up_date',
        'status',
        'is_notified',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'follow_up_date' => 'date:Y-m-d',
            'is_notified' => 'boolean',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function sourceVisit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'source_visit_id');
    }
}

