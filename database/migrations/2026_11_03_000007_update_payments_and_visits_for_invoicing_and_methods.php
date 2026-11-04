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
        // 1. Update payments table
        Schema::table('payments', function (Blueprint $table) {
            $table->string('invoice_number', 50)->nullable()->unique()->after('id');
            $table->foreignId('visit_id')->nullable()->after('patient_id')->constrained('visits')->nullOnDelete();
            $table->string('payment_method', 30)->default('cash')->after('payment_type');
            $table->foreignId('bank_account_id')->nullable()->after('payment_method')->constrained('bank_accounts')->nullOnDelete();
            $table->text('notes')->nullable()->after('payment_date');

            $table->index(['payment_method']);
            $table->index(['invoice_number']);
        });

        // 2. Update visits table
        Schema::table('visits', function (Blueprint $table) {
            $table->string('invoice_number', 50)->nullable()->after('serial_number');
            $table->foreignId('payment_id')->nullable()->after('invoice_number')->constrained('payments')->nullOnDelete();

            $table->index(['invoice_number']);
        });

        // 3. Update patient_treatments table
        Schema::table('patient_treatments', function (Blueprint $table) {
            $table->string('invoice_number', 50)->nullable()->after('token_number');

            $table->index(['invoice_number']);
        });

        // 4. Backfill existing payments with invoice_number
        $payments = DB::table('payments')->get();
        foreach ($payments as $p) {
            $prefix = $p->payment_type === 'visit' ? 'INV-VIS-' : 'INV-TRT-';
            $invNo = $prefix . str_pad((string) $p->id, 5, '0', STR_PAD_LEFT);
            DB::table('payments')->where('id', $p->id)->update([
                'invoice_number' => $invNo,
                'payment_method' => 'cash',
            ]);

            // Sync with patient_treatments if treatment
            if ($p->payment_type === 'treatment') {
                DB::table('patient_treatments')->where('payment_id', $p->id)->update([
                    'invoice_number' => $invNo,
                ]);
            }
        }

        // 5. Backfill existing visits with invoice_number and payment link
        $visits = DB::table('visits')->get();
        foreach ($visits as $v) {
            $payment = DB::table('payments')
                ->where('patient_id', $v->patient_id)
                ->where('payment_type', 'visit')
                ->whereDate('payment_date', $v->visit_date)
                ->whereNull('visit_id')
                ->first();

            if ($payment) {
                DB::table('payments')->where('id', $payment->id)->update(['visit_id' => $v->id]);
                DB::table('visits')->where('id', $v->id)->update([
                    'payment_id' => $payment->id,
                    'invoice_number' => $payment->invoice_number,
                ]);
            } else {
                $invNo = 'INV-VIS-' . str_pad((string) $v->id, 5, '0', STR_PAD_LEFT);
                DB::table('visits')->where('id', $v->id)->update([
                    'invoice_number' => $invNo,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_treatments', function (Blueprint $table) {
            $table->dropColumn('invoice_number');
        });

        Schema::table('visits', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
            $table->dropColumn(['invoice_number', 'payment_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['visit_id']);
            $table->dropForeign(['bank_account_id']);
            $table->dropColumn(['invoice_number', 'visit_id', 'payment_method', 'bank_account_id', 'notes']);
        });
    }
};

