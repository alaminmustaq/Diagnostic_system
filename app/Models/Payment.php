<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    public const METHOD_CASH = 'cash';
    public const METHOD_BANK = 'bank';
    public const METHOD_MOBILE_BANKING = 'mobile_banking';
    public const METHOD_MULTIPLE = 'multiple';

    public const TYPE_VISIT = 'visit';
    public const TYPE_TREATMENT = 'treatment';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'invoice_number',
        'patient_id',
        'visit_id',
        'payment_type',
        'payment_method',
        'bank_account_id',
        'collected_by',
        'base_amount',
        'discount_type',
        'discount_amount',
        'final_paid_amount',
        'payment_date',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_paid_amount' => 'decimal:2',
            'payment_date' => 'date:Y-m-d',
        ];
    }

    /**
     * Generate standard sequential invoice number.
     */
    public static function generateInvoiceNumber(string $type, int $id): string
    {
        $prefix = $type === self::TYPE_VISIT ? 'INV-VIS-' : 'INV-TRT-';
        return $prefix . str_pad((string) $id, 5, '0', STR_PAD_LEFT);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class, 'visit_id');
    }

    public function patientTreatments(): HasMany
    {
        return $this->hasMany(PatientTreatment::class, 'payment_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }

    public function splits(): HasMany
    {
        return $this->hasMany(PaymentSplit::class, 'payment_id');
    }

    public function collectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'collected_by');
    }
}
