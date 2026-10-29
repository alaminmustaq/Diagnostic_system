<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CompanySetting extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'company_name',
        'company_phone',
        'company_email',
        'company_address',
        'company_logo',
        'token_print_size',
        'print_separate_slips',
        'token_header_note',
        'token_footer_note',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'logo_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'print_separate_slips' => 'boolean',
        ];
    }

    public static function getSettings(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'company_name' => 'Aesthetic & Dermatology Clinic',
                'company_phone' => '+880 1700-000000',
                'company_email' => 'info@clinicdiagnostic.com',
                'company_address' => 'House #12, Road #5, Dhanmondi, Dhaka',
                'company_logo' => null,
                'token_print_size' => '80mm',
                'print_separate_slips' => true,
                'token_header_note' => 'Patient Serial Consultation Token',
                'token_footer_note' => 'Please wait in the reception lounge until your serial is announced.',
            ]
        );
    }

    protected function logoUrl(): Attribute
    {
        return Attribute::make(
            get: function (): ?string {
                if (! $this->company_logo) {
                    return null;
                }
                if (str_starts_with($this->company_logo, 'http')) {
                    return $this->company_logo;
                }
                return Storage::disk('public')->url($this->company_logo);
            }
        );
    }
}

