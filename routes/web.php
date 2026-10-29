<?php

use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Consultation\Controllers\ConsultationController;
use App\Modules\Dashboard\Controllers\DashboardController;
use App\Modules\FollowUpNotification\Controllers\FollowUpController;
use App\Modules\PosTreatment\Controllers\PosTreatmentController;
use App\Modules\Reports\Controllers\ReportController;
use App\Modules\SerialBooking\Controllers\SerialBookingController;
use App\Modules\Settings\Controllers\SettingsController;
use App\Modules\SystemSetup\Controllers\DoctorSetupController;
use App\Modules\SystemSetup\Controllers\TreatmentSetupController;
use Illuminate\Support\Facades\Route;

// Public Auth routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/quick-login', [AuthController::class, 'quickLogin'])->name('quick-login');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Protected application routes
Route::middleware(['auth'])->group(function () {
    Route::get('/', fn () => redirect()->route('dashboard'));
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Module 1: System Setup
    Route::prefix('admin')->name('admin.')->group(function () {
        // Doctor Setup
        Route::get('/doctors', [DoctorSetupController::class, 'index'])->name('doctors.index');
        Route::post('/doctors', [DoctorSetupController::class, 'store'])->name('doctors.store');
        Route::put('/doctors/{id}', [DoctorSetupController::class, 'update'])->name('doctors.update');
        Route::delete('/doctors/{id}', [DoctorSetupController::class, 'destroy'])->name('doctors.destroy');

        // Treatment Setup
        Route::get('/treatments', [TreatmentSetupController::class, 'index'])->name('treatments.index');
        Route::post('/categories', [TreatmentSetupController::class, 'storeCategory'])->name('categories.store');
        Route::put('/categories/{id}', [TreatmentSetupController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{id}', [TreatmentSetupController::class, 'destroyCategory'])->name('categories.destroy');
        Route::post('/treatments', [TreatmentSetupController::class, 'storeTreatment'])->name('treatments.store');
        Route::put('/treatments/{id}', [TreatmentSetupController::class, 'updateTreatment'])->name('treatments.update');
        Route::delete('/treatments/{id}', [TreatmentSetupController::class, 'destroyTreatment'])->name('treatments.destroy');
    });

    // Module 2: Serial Booking
    Route::prefix('booking')->name('booking.')->group(function () {
        Route::get('/', [SerialBookingController::class, 'index'])->name('index');
        Route::get('/search-patient', [SerialBookingController::class, 'searchPatient'])->name('search-patient');
        Route::post('/store', [SerialBookingController::class, 'store'])->name('store');
    });

    // Module 3: Consultation & Queue
    Route::prefix('consultation')->name('consultation.')->group(function () {
        Route::get('/queue', [ConsultationController::class, 'queue'])->name('queue');
        Route::get('/room', [ConsultationController::class, 'doctorRoom'])->name('room');
        Route::patch('/visits/{id}/status', [ConsultationController::class, 'updateStatus'])->name('update-status');
        Route::post('/visits/{id}/prescribe-follow-up', [ConsultationController::class, 'prescribeFollowUp'])->name('prescribe-follow-up');
    });

    // Module 4: POS & Treatments
    Route::prefix('pos')->name('pos.')->group(function () {
        Route::get('/', [PosTreatmentController::class, 'index'])->name('index');
        Route::post('/store', [PosTreatmentController::class, 'store'])->name('store');
    });

    // Module 5: Follow-Ups & Notifications
    Route::prefix('follow-ups')->name('follow-ups.')->group(function () {
        Route::get('/', [FollowUpController::class, 'index'])->name('index');
        Route::post('/run-daily-job', [FollowUpController::class, 'runDailyJob'])->name('run-daily-job');
        Route::post('/{id}/mark-notified', [FollowUpController::class, 'markNotified'])->name('mark-notified');
        Route::patch('/{id}/status', [FollowUpController::class, 'updateStatus'])->name('update-status');
    });

    // Module 6: Reports & Analytics
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // Settings
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/company', [SettingsController::class, 'companySetup'])->name('company');
        Route::post('/company', [SettingsController::class, 'updateCompanySetup'])->name('company.update');
        Route::get('/configuration', [SettingsController::class, 'configuration'])->name('configuration');
        Route::post('/configuration', [SettingsController::class, 'updateConfiguration'])->name('configuration.update');
    });
});
