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
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->foreignId('room_id')
                ->nullable()
                ->after('user_id')
                ->constrained('rooms')
                ->nullOnDelete();
        });

        // Backfill existing doctor_profiles with matching room_id from rooms
        if (Schema::hasColumn('doctor_profiles', 'room_number')) {
            $profiles = DB::table('doctor_profiles')->whereNull('room_id')->get();
            foreach ($profiles as $profile) {
                if (! empty($profile->room_number)) {
                    $roomId = DB::table('rooms')
                        ->where('room_number', $profile->room_number)
                        ->value('id');

                    if ($roomId) {
                        DB::table('doctor_profiles')
                            ->where('id', $profile->id)
                            ->update(['room_id' => $roomId]);
                    }
                }
            }

            Schema::table('doctor_profiles', function (Blueprint $table) {
                $table->dropColumn('room_number');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->string('room_number', 50)->nullable()->after('degrees');
        });

        $profiles = DB::table('doctor_profiles')->whereNotNull('room_id')->get();
        foreach ($profiles as $profile) {
            $roomNumber = DB::table('rooms')
                ->where('id', $profile->room_id)
                ->value('room_number');

            if ($roomNumber) {
                DB::table('doctor_profiles')
                    ->where('id', $profile->id)
                    ->update(['room_number' => $roomNumber]);
            }
        }

        Schema::table('doctor_profiles', function (Blueprint $table) {
            $table->dropForeign(['room_id']);
            $table->dropColumn('room_id');
        });
    }
};
