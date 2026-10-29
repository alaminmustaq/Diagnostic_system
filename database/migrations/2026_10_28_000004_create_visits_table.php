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
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->index()->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->date('visit_date');
            $table->integer('serial_number');
            $table->enum('status', ['waiting', 'in_consultation', 'completed', 'cancelled'])->default('waiting');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['doctor_id', 'visit_date']);
            $table->index(['visit_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visits');
    }
};

