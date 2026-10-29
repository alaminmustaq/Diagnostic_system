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
        Schema::create('follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('source_visit_id')->nullable()->constrained('visits')->nullOnDelete();
            $table->date('follow_up_date');
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->boolean('is_notified')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['follow_up_date', 'is_notified']);
            $table->index(['patient_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('follow_ups');
    }
};

