<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->text('whatsapp_followup_message')
                ->nullable()
                ->default('Hello {patient_name}, this is a reminder from {clinic_name}. Your scheduled follow-up consultation with {doctor_name} is due on {follow_up_date}. Please visit on time. Thank you!')
                ->after('token_footer_note');
        });
    }

    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('whatsapp_followup_message');
        });
    }
};

