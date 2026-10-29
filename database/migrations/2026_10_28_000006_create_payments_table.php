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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->index()->constrained('users')->cascadeOnDelete();
            $table->enum('payment_type', ['visit', 'treatment']);
            $table->foreignId('collected_by')->constrained('users')->cascadeOnDelete();
            $table->decimal('base_amount', 10, 2);
            $table->enum('discount_type', ['fixed', 'percentage'])->nullable();
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('final_paid_amount', 10, 2)->default(0.00);
            $table->date('payment_date');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['payment_type', 'payment_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

