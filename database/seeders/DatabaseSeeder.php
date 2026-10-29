<?php

namespace Database\Seeders;

use App\Models\DoctorProfile;
use App\Models\FollowUp;
use App\Models\PatientTreatment;
use App\Models\Payment;
use App\Models\Treatment;
use App\Models\TreatmentCategory;
use App\Models\User;
use App\Models\Visit;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Company Settings
        \App\Models\CompanySetting::getSettings();

        // 1. Admin
        $admin = User::firstOrCreate(
            ['phone' => '01700000000'],
            [
                'name' => 'Clinic Reception & Admin',
                'role' => 'admin',
                'password' => Hash::make('password'),
            ]
        );

        // 2. Doctors
        $doctorUser1 = User::firstOrCreate(
            ['phone' => '01800000000'],
            [
                'name' => 'Dr. Ariful Islam',
                'role' => 'doctor',
                'password' => Hash::make('password'),
            ]
        );

        DoctorProfile::firstOrCreate(
            ['user_id' => $doctorUser1->id],
            [
                'designation' => 'Senior Hair Specialist & Trichologist',
                'degrees' => 'MBBS, MD (Dermatology)',
                'room_number' => 'Room 102',
                'professional_phone' => '01800000001',
                'bio_summary' => 'Expert in advanced hair restoration, PRP/GFC therapies, and cosmetic dermatology.',
                'default_visit_rate' => 1000.00,
            ]
        );

        $doctorUser2 = User::firstOrCreate(
            ['phone' => '01900000000'],
            [
                'name' => 'Dr. Farhana Rahman',
                'role' => 'doctor',
                'password' => Hash::make('password'),
            ]
        );

        DoctorProfile::firstOrCreate(
            ['user_id' => $doctorUser2->id],
            [
                'designation' => 'Consultant Dermatologist & Laser Surgeon',
                'degrees' => 'MBBS, FCPS (Dermatology & VD)',
                'room_number' => 'Room 205',
                'professional_phone' => '01900000002',
                'bio_summary' => 'Specialized in laser skin procedures, acne scar revision, and aesthetic rejuvenation.',
                'default_visit_rate' => 1200.00,
            ]
        );

        // 3. Treatment Categories
        $catLaser = TreatmentCategory::firstOrCreate(
            ['name' => 'Laser Therapies'],
            ['ordering' => 1, 'is_active' => true]
        );

        $catHair = TreatmentCategory::firstOrCreate(
            ['name' => 'Hair Restoration & Transplants'],
            ['ordering' => 2, 'is_active' => true]
        );

        $catSkin = TreatmentCategory::firstOrCreate(
            ['name' => 'Skin Rejuvenation & Aesthetics'],
            ['ordering' => 3, 'is_active' => true]
        );

        // 4. Treatments
        $treatmentsData = [
            ['cat' => $catLaser, 'name' => 'Fractional CO2 Laser Therapy', 'price' => 3500.00, 'order' => 1],
            ['cat' => $catLaser, 'name' => 'Q-Switch Nd:YAG Laser (Pigmentation)', 'price' => 2500.00, 'order' => 2],
            ['cat' => $catLaser, 'name' => 'Laser Hair Removal (Full Face)', 'price' => 2000.00, 'order' => 3],
            ['cat' => $catHair, 'name' => 'PRP Hair Follicle Therapy', 'price' => 3000.00, 'order' => 1],
            ['cat' => $catHair, 'name' => 'GFC Concentrated Hair Regrowth', 'price' => 4500.00, 'order' => 2],
            ['cat' => $catHair, 'name' => 'FUE Hair Transplant (1000 Grafts)', 'price' => 25000.00, 'order' => 3],
            ['cat' => $catSkin, 'name' => 'Medical Grade HydraFacial', 'price' => 2000.00, 'order' => 1],
            ['cat' => $catSkin, 'name' => 'Chemical Peel (Acne & Brightening)', 'price' => 1500.00, 'order' => 2],
            ['cat' => $catSkin, 'name' => 'Microneedling Dermapen Therapy', 'price' => 2800.00, 'order' => 3],
        ];

        $createdTreatments = [];
        foreach ($treatmentsData as $tData) {
            $createdTreatments[] = Treatment::firstOrCreate(
                ['name' => $tData['name'], 'category_id' => $tData['cat']->id],
                [
                    'price' => $tData['price'],
                    'ordering' => $tData['order'],
                    'is_active' => true,
                ]
            );
        }

        // 5. Sample Patients
        $patient1 = User::firstOrCreate(
            ['phone' => '01711111111'],
            ['name' => 'Tanvir Ahmed', 'role' => 'patient']
        );

        $patient2 = User::firstOrCreate(
            ['phone' => '01722222222'],
            ['name' => 'Sabrina Sultana', 'role' => 'patient']
        );

        $patient3 = User::firstOrCreate(
            ['phone' => '01733333333'],
            ['name' => 'Mohammad Kabir', 'role' => 'patient']
        );

        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();
        $pastDate = Carbon::today()->subDays(5)->toDateString();

        // Historical visit for patient 1
        $visitPast = Visit::firstOrCreate(
            ['patient_id' => $patient1->id, 'doctor_id' => $doctorUser1->id, 'visit_date' => $pastDate],
            ['serial_number' => 1, 'status' => 'completed']
        );

        // Historical payment for patient 1 visit (First Visit Charge)
        Payment::firstOrCreate(
            ['patient_id' => $patient1->id, 'payment_type' => 'visit', 'payment_date' => $pastDate],
            [
                'collected_by' => $admin->id,
                'base_amount' => 1000.00,
                'discount_type' => 'fixed',
                'discount_amount' => 100.00,
                'final_paid_amount' => 900.00,
            ]
        );

        // Today's Visits
        $visit1 = Visit::firstOrCreate(
            ['patient_id' => $patient2->id, 'doctor_id' => $doctorUser1->id, 'visit_date' => $today],
            ['serial_number' => 1, 'status' => 'in_consultation']
        );

        // First visit payment for patient 2
        Payment::firstOrCreate(
            ['patient_id' => $patient2->id, 'payment_type' => 'visit', 'payment_date' => $today],
            [
                'collected_by' => $admin->id,
                'base_amount' => 1000.00,
                'discount_type' => null,
                'discount_amount' => 0.00,
                'final_paid_amount' => 1000.00,
            ]
        );

        $visit2 = Visit::firstOrCreate(
            ['patient_id' => $patient3->id, 'doctor_id' => $doctorUser1->id, 'visit_date' => $today],
            ['serial_number' => 2, 'status' => 'waiting']
        );

        Payment::firstOrCreate(
            ['patient_id' => $patient3->id, 'payment_type' => 'visit', 'payment_date' => $today],
            [
                'collected_by' => $admin->id,
                'base_amount' => 1000.00,
                'discount_type' => 'percentage',
                'discount_amount' => 10.00,
                'final_paid_amount' => 900.00,
            ]
        );

        // Follow ups
        FollowUp::firstOrCreate(
            ['patient_id' => $patient1->id, 'doctor_id' => $doctorUser1->id, 'follow_up_date' => $tomorrow],
            [
                'source_visit_id' => $visitPast->id,
                'status' => 'pending',
                'is_notified' => false,
            ]
        );

        FollowUp::firstOrCreate(
            ['patient_id' => $patient2->id, 'doctor_id' => $doctorUser1->id, 'follow_up_date' => Carbon::today()->addDays(7)->toDateString()],
            [
                'source_visit_id' => $visit1->id,
                'status' => 'pending',
                'is_notified' => false,
            ]
        );

        // Patient Treatments & POS payments
        PatientTreatment::firstOrCreate(
            ['patient_id' => $patient1->id, 'treatment_id' => $createdTreatments[3]->id, 'date_administered' => $pastDate],
            []
        );

        Payment::firstOrCreate(
            ['patient_id' => $patient1->id, 'payment_type' => 'treatment', 'payment_date' => $pastDate],
            [
                'collected_by' => $admin->id,
                'base_amount' => 3000.00,
                'discount_type' => null,
                'discount_amount' => 0.00,
                'final_paid_amount' => 3000.00,
            ]
        );
    }
}
