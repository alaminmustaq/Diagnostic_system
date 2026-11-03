<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('user_code', 50)->nullable()->unique()->after('id');
        });

        // Backfill existing patients with formatted sequential user_code
        $patients = DB::table('users')->where('role', 'patient')->orderBy('id')->get();
        $index = 1;
        foreach ($patients as $patient) {
            $code = 'PT-' . str_pad((string) $index, 4, '0', STR_PAD_LEFT);
            DB::table('users')->where('id', $patient->id)->update(['user_code' => $code]);
            $index++;
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('user_code');
        });
    }
};

