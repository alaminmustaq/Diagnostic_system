<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankAccount extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPE_BANK = 'bank';
    public const TYPE_MOBILE_BANKING = 'mobile_banking';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'type',
        'bank_name',
        'account_name',
        'account_number',
        'account_type',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope to filter bank accounts only.
     */
    public function scopeBank(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_BANK);
    }

    /**
     * Scope to filter mobile banking accounts only.
     */
    public function scopeMobileBanking(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_MOBILE_BANKING);
    }
}

