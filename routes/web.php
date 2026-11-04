<?php

use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Consultation\Controllers\ConsultationController;
use App\Modules\Dashboard\Controllers\DashboardController;
use App\Modules\Finance\Controllers\BankAccountController;
use App\Modules\FollowUpNotification\Controllers\FollowUpController;
use App\Modules\PosTreatment\Controllers\PatientTreatmentController;
use App\Modules\PosTreatment\Controllers\PosTreatmentController;
use App\Modules\Reports\Controllers\ReportController;
use App\Modules\SerialBooking\Controllers\SerialBookingController;
use App\Modules\Settings\Controllers\RolePermissionController;
use App\Modules\Settings\Controllers\SettingsController;
use App\Modules\SystemSetup\Controllers\DoctorSetupController;
use App\Modules\SystemSetup\Controllers\RoomSetupController;
use App\Modules\SystemSetup\Controllers\TreatmentSetupController;
use Illuminate\Support\Facades\Route;

// Public Auth routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/quick-login', [AuthController::class, 'quickLogin'])->name('quick-login');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Protected application routes
Route::middleware(['auth'])->group(function () {
    Route::get('/', fn() => redirect()->route('dashboard'));
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard')->middleware('can:view-dashboard');

    // Module 1: System Setup
    Route::prefix('admin')->name('admin.')->group(function () {
        // Doctor Setup
        Route::get('/doctors', [DoctorSetupController::class, 'index'])->name('doctors.index')->middleware('can:view-doctors');
        Route::post('/doctors', [DoctorSetupController::class, 'store'])->name('doctors.store')->middleware('can:create-doctors');
        Route::put('/doctors/{id}', [DoctorSetupController::class, 'update'])->name('doctors.update')->middleware('can:update-doctors');
        Route::delete('/doctors/{id}', [DoctorSetupController::class, 'destroy'])->name('doctors.destroy')->middleware('can:delete-doctors');

        // Room Setup
        Route::get('/rooms', [RoomSetupController::class, 'index'])->name('rooms.index')->middleware('can:view-rooms');
        Route::post('/rooms', [RoomSetupController::class, 'store'])->name('rooms.store')->middleware('can:create-rooms');
        Route::put('/rooms/{id}', [RoomSetupController::class, 'update'])->name('rooms.update')->middleware('can:update-rooms');
        Route::delete('/rooms/{id}', [RoomSetupController::class, 'destroy'])->name('rooms.destroy')->middleware('can:delete-rooms');

        // Treatment Setup
        Route::get('/treatments', [TreatmentSetupController::class, 'index'])->name('treatments.index')->middleware('can:view-treatments');
        Route::post('/categories', [TreatmentSetupController::class, 'storeCategory'])->name('categories.store')->middleware('can:create-treatments');
        Route::put('/categories/{id}', [TreatmentSetupController::class, 'updateCategory'])->name('categories.update')->middleware('can:update-treatments');
        Route::delete('/categories/{id}', [TreatmentSetupController::class, 'destroyCategory'])->name('categories.destroy')->middleware('can:delete-treatments');
        Route::post('/treatments', [TreatmentSetupController::class, 'storeTreatment'])->name('treatments.store')->middleware('can:create-treatments');
        Route::put('/treatments/{id}', [TreatmentSetupController::class, 'updateTreatment'])->name('treatments.update')->middleware('can:update-treatments');
        Route::delete('/treatments/{id}', [TreatmentSetupController::class, 'destroyTreatment'])->name('treatments.destroy')->middleware('can:delete-treatments');
    });

    // Module 2: Serial Booking
    Route::prefix('booking')->name('booking.')->group(function () {
        Route::get('/', [SerialBookingController::class, 'index'])->name('index')->middleware('can:view-booking');
        Route::get('/search-patient', [SerialBookingController::class, 'searchPatient'])->name('search-patient')->middleware('can:view-booking');
        Route::post('/store', [SerialBookingController::class, 'store'])->name('store')->middleware('can:create-booking');
    });

    // Module 3: Consultation & Queue
    Route::prefix('consultation')->name('consultation.')->group(function () {
        Route::get('/queue', [ConsultationController::class, 'queue'])->name('queue')->middleware('can:view-consultation-queue');
        Route::get('/room', [ConsultationController::class, 'doctorRoom'])->name('room')->middleware('can:view-consultation-room');
        Route::patch('/visits/{id}/status', [ConsultationController::class, 'updateStatus'])->name('update-status');
        Route::patch('/treatments/{id}/status', [ConsultationController::class, 'updateTreatmentStatus'])->name('update-treatment-status');
        Route::put('/treatments/{id}', [ConsultationController::class, 'updateTreatment'])->name('treatments.update');
        Route::delete('/treatments/{id}', [ConsultationController::class, 'destroyTreatment'])->name('treatments.destroy');
        Route::post('/visits/{id}/prescribe-follow-up', [ConsultationController::class, 'prescribeFollowUp'])->name('prescribe-follow-up')->middleware('can:update-consultation-room');
    });

    // Module 4: POS & Treatments
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/', [PosTreatmentController::class, 'index'])->name('index')->middleware('can:view-pos-treatment');
        Route::post('/store', [PosTreatmentController::class, 'store'])->name('store')->middleware('can:create-pos-treatment');
        Route::put('/patient-treatments/{id}', [PatientTreatmentController::class, 'update'])->name('patient-treatments.update');
        Route::delete('/patient-treatments/{id}', [PatientTreatmentController::class, 'destroy'])->name('patient-treatments.destroy');
    });

    // Module 4.1: Dedicated Patient Treatments Records
    Route::prefix('patient-treatments')->name('patient-treatments.')->group(function () {
        Route::get('/', [PatientTreatmentController::class, 'index'])->name('index')->middleware('can:view-pos-treatment');
        Route::put('/{id}', [PatientTreatmentController::class, 'update'])->name('update');
        Route::delete('/{id}', [PatientTreatmentController::class, 'destroy'])->name('destroy');
    });

    // Module 5: Follow-Ups & Notifications
    Route::prefix('follow-ups')->name('follow-ups.')->group(function () {
        Route::get('/', [FollowUpController::class, 'index'])->name('index')->middleware('can:view-follow-ups');
        Route::post('/run-daily-job', [FollowUpController::class, 'runDailyJob'])->name('run-daily-job');
        Route::post('/{id}/mark-notified', [FollowUpController::class, 'markNotified'])->name('mark-notified');
        Route::patch('/{id}/status', [FollowUpController::class, 'updateStatus'])->name('update-status')->middleware('can:update-follow-ups');
    });

    // Module 6: Reports & Analytics
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index')->middleware('can:view-reports');

    // Module 7: Finance
    Route::prefix('finance')->name('finance.')->group(function () {
        // Bank Setup
        Route::get('/banks', [BankAccountController::class, 'bankIndex'])->name('banks.index')->middleware('can:view-banks');
        Route::post('/banks', [BankAccountController::class, 'bankStore'])->name('banks.store')->middleware('can:create-banks');
        Route::put('/banks/{id}', [BankAccountController::class, 'bankUpdate'])->name('banks.update')->middleware('can:update-banks');
        Route::delete('/banks/{id}', [BankAccountController::class, 'destroyBank'])->name('banks.destroy')->middleware('can:delete-banks');

        // Mobile Banking Setup
        Route::get('/mobile-banking', [BankAccountController::class, 'mobileBankingIndex'])->name('mobile-banking.index')->middleware('can:view-mobile-banking');
        Route::post('/mobile-banking', [BankAccountController::class, 'mobileBankingStore'])->name('mobile-banking.store')->middleware('can:create-mobile-banking');
        Route::put('/mobile-banking/{id}', [BankAccountController::class, 'mobileBankingUpdate'])->name('mobile-banking.update')->middleware('can:update-mobile-banking');
        Route::delete('/mobile-banking/{id}', [BankAccountController::class, 'destroyMobileBanking'])->name('mobile-banking.destroy')->middleware('can:delete-mobile-banking');
    });

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/company', [SettingsController::class, 'companySetup'])->name('company')->middleware('can:view-company-settings');
        Route::post('/company', [SettingsController::class, 'updateCompanySetup'])->name('company.update')->middleware('can:update-company-settings');
        Route::get('/configuration', [SettingsController::class, 'configuration'])->name('configuration')->middleware('can:view-configuration-settings');
        Route::post('/configuration', [SettingsController::class, 'updateConfiguration'])->name('configuration.update')->middleware('can:update-configuration-settings');

        // Roles & Permissions Management
        Route::get('/roles', [RolePermissionController::class, 'index'])->name('roles.index')->middleware('can:view-roles-permissions');
        Route::post('/roles', [RolePermissionController::class, 'store'])->name('roles.store')->middleware('can:create-roles-permissions');
        Route::put('/roles/{id}', [RolePermissionController::class, 'update'])->name('roles.update')->middleware('can:update-roles-permissions');
        Route::delete('/roles/{id}', [RolePermissionController::class, 'destroy'])->name('roles.destroy')->middleware('can:delete-roles-permissions');
        Route::post('/users/{id}/assign-role', [RolePermissionController::class, 'assignUserRole'])->name('roles.assign-user')->middleware('can:update-roles-permissions');
    });
});
