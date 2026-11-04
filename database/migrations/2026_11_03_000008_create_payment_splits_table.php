<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_splits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('payment_method', 30)->default('cash'); // 'cash', 'bank', 'mobile_banking'
            $table->foreignId('bank_account_id')->nullable()->constrained('bank_accounts')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('transaction_reference', 100)->nullable();
            $table->timestamps();

            $table->index(['payment_id', 'payment_method']);
        });

        // Backfill existing payments into payment_splits
        $payments = DB::table('payments')->get();
        foreach ($payments as $p) {
            $amount = (float) ($p->final_paid_amount > 0 ? $p->final_paid_amount : $p->base_amount);
            if ($amount > 0) {
                DB::table('payment_splits')->insert([
                    'payment_id' => $p->id,
                    'payment_method' => $p->payment_method ?? 'cash',
                    'bank_account_id' => $p->bank_account_id ?? null,
                    'amount' => $amount,
                    'created_at' => $p->created_at ?? now(),
                    'updated_at' => $p->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_splits');
    }
};

