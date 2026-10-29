<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('Aesthetic & Dermatology Clinic');
            $table->string('company_phone')->nullable()->default('+880 1700-000000');
            $table->text('company_address')->nullable()->default('House #12, Road #5, Dhanmondi, Dhaka');
            $table->string('company_logo')->nullable();
            $table->string('token_print_size', 20)->default('80mm'); // 80mm, 58mm, a5, a4
            $table->boolean('print_separate_slips')->default(true);
            $table->string('token_header_note')->nullable()->default('Patient Serial Consultation Token');
            $table->string('token_footer_note')->nullable()->default('Please wait in the reception lounge until your serial is announced.');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};

