<?php

namespace Tests\Feature;

use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::create([
            'name' => 'Admin Test',
            'phone' => '01700000000',
            'role' => 'admin',
            'password' => 'secret123',
        ]);
    }

    public function test_can_view_company_setup_page(): void
    {
        $response = $this->actingAs($this->admin)->get('/settings/company');

        $response->assertOk();
    }

    public function test_can_update_company_details_including_email_and_location(): void
    {
        $response = $this->actingAs($this->admin)->post('/settings/company', [
            'company_name' => 'Apex Skin & Hair Care',
            'company_phone' => '+880 1812-345678',
            'company_email' => 'contact@apexskincare.com',
            'company_address' => 'Plot 45, Gulshan-2, Dhaka',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('company_settings', [
            'company_name' => 'Apex Skin & Hair Care',
            'company_phone' => '+880 1812-345678',
            'company_email' => 'contact@apexskincare.com',
            'company_address' => 'Plot 45, Gulshan-2, Dhaka',
        ]);
    }

    public function test_can_upload_and_remove_company_logo(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('clinic_logo.png', 200, 200);

        $response = $this->actingAs($this->admin)->post('/settings/company', [
            'company_name' => 'Apex Skin & Hair Care',
            'company_logo' => $file,
        ]);

        $response->assertSessionHas('success');

        $setting = CompanySetting::getSettings();
        $this->assertNotNull($setting->company_logo);
        Storage::disk('public')->assertExists($setting->company_logo);

        // Test SVG upload
        $svgFile = UploadedFile::fake()->create('clinic_vector.svg', 500, 'image/svg+xml');
        $svgResponse = $this->actingAs($this->admin)->post('/settings/company', [
            'company_name' => 'Apex Skin & Hair Care',
            'company_logo' => $svgFile,
        ]);
        $svgResponse->assertSessionHas('success');
        $setting->refresh();
        $this->assertNotNull($setting->company_logo);
        $this->assertTrue(str_ends_with($setting->company_logo, '.svg'));

        // Now remove the logo
        $removeResponse = $this->actingAs($this->admin)->post('/settings/company', [
            'company_name' => 'Apex Skin & Hair Care',
            'remove_logo' => true,
        ]);

        $removeResponse->assertSessionHas('success');
        $setting->refresh();
        $this->assertNull($setting->company_logo);

        // Test Base64 direct logo upload
        $base64Sample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        $b64Response = $this->actingAs($this->admin)->post('/settings/company', [
            'company_name' => 'Apex Skin & Hair Care',
            'company_logo_base64' => $base64Sample,
        ]);
        $b64Response->assertSessionHas('success');
        $setting->refresh();
        $this->assertNotNull($setting->company_logo);
        $this->assertTrue(str_ends_with($setting->company_logo, '.png'));
        Storage::disk('public')->assertExists($setting->company_logo);
    }

    public function test_can_view_configuration_page(): void
    {
        $response = $this->actingAs($this->admin)->get('/settings/configuration');

        $response->assertOk();
    }

    public function test_can_update_print_and_token_configuration(): void
    {
        $response = $this->actingAs($this->admin)->post('/settings/configuration', [
            'token_print_size' => '58mm',
            'print_separate_slips' => true,
            'token_header_note' => 'Custom Queue Token',
            'token_footer_note' => 'Please have a seat in the waiting lounge.',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('company_settings', [
            'token_print_size' => '58mm',
            'print_separate_slips' => true,
            'token_header_note' => 'Custom Queue Token',
            'token_footer_note' => 'Please have a seat in the waiting lounge.',
        ]);
    }
}

