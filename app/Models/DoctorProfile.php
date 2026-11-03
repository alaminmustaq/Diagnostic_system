<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DoctorProfile extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'room_id',
        'designation',
        'degrees',
        'professional_phone',
        'bio_summary',
        'default_visit_rate',
    ];

    /**
     * Always eager-load the associated room.
     *
     * @var list<string>
     */
    protected $with = ['room'];

    /**
     * Append computed room_number from the room relation for frontend convenience.
     *
     * @var list<string>
     */
    protected $appends = ['room_number'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'room_id' => 'integer',
            'default_visit_rate' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    public function getRoomNumberAttribute(): ?string
    {
        return $this->room?->room_number;
    }
}
