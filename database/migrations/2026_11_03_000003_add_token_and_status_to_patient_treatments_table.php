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
        Schema::table('patient_treatments', function (Blueprint $table) {
            $table->foreignId('payment_id')
                ->nullable()
                ->after('treatment_id')
                ->constrained('payments')
                ->nullOnDelete();
            $table->integer('serial_number')->nullable()->after('payment_id');
            $table->string('token_number', 50)->nullable()->after('serial_number');
            $table->string('status', 30)->default('waiting')->after('token_number');

            $table->index(['date_administered', 'status']);
        });

        // Backfill existing rows with sample (completed) status and tokens
        $records = DB::table('patient_treatments')->whereNull('token_number')->get();
        foreach ($records as $index => $rec) {
            $serial = $index + 1;
            $token = 'TRT-' . str_pad((string) $serial, 3, '0', STR_PAD_LEFT);
            DB::table('patient_treatments')->where('id', $rec->id)->update([
                'serial_number' => $serial,
                'token_number' => $token,
                'status' => 'sample',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patient_treatments', function (Blueprint $table) {
            $table->dropForeign(['payment_id']);
            $table->dropColumn(['payment_id', 'serial_number', 'token_number', 'status']);
        });
    }
};

