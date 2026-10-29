<?php

namespace App\Modules\Settings\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function companySetup(): Response
    {
        $setting = CompanySetting::getSettings();

        return Inertia::render('Settings/CompanySetup', [
            'setting' => $setting,
        ]);
    }

    public function updateCompanySetup(Request $request): RedirectResponse
    {
        // 1. If an UploadedFile has a PHP system error, log it
        if ($request->file('company_logo')) {
            $incomingFile = $request->file('company_logo');
            if ($incomingFile instanceof \Illuminate\Http\UploadedFile && ! $incomingFile->isValid()) {
                \Illuminate\Support\Facades\Log::warning('UploadedFile has upload error, falling back to base64 if present: ' . $incomingFile->getErrorMessage());
            }
        }

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'company_phone' => ['nullable', 'string', 'max:50'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'company_logo' => ['nullable'],
            'company_logo_base64' => ['nullable', 'string'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);

        $setting = CompanySetting::getSettings();

        $updateData = [
            'company_name' => $validated['company_name'],
            'company_phone' => $validated['company_phone'] ?? null,
            'company_email' => $validated['company_email'] ?? null,
            'company_address' => $validated['company_address'] ?? null,
        ];

        // Option A: Base64 payload (direct binary write, completely immune to Windows temp directory issues)
        if ($request->filled('company_logo_base64')) {
            $base64 = $request->input('company_logo_base64');
            if (preg_match('/^data:image\/([a-zA-Z0-9\+\-\.]+);base64,/', $base64, $matches)) {
                $rawExt = strtolower($matches[1]);
                $ext = match ($rawExt) {
                    'svg+xml', 'svg' => 'svg',
                    'jpeg', 'jpg' => 'jpg',
                    'png' => 'png',
                    'webp' => 'webp',
                    'gif' => 'gif',
                    default => 'png',
                };

                $cleanData = substr($base64, strpos($base64, ',') + 1);
                $decoded = base64_decode($cleanData, true);

                if ($decoded !== false) {
                    if ($setting->company_logo && Storage::disk('public')->exists($setting->company_logo)) {
                        Storage::disk('public')->delete($setting->company_logo);
                    }
                    Storage::disk('public')->makeDirectory('logos');
                    $filename = 'logos/' . Str::random(40) . '.' . $ext;
                    Storage::disk('public')->put($filename, $decoded);
                    $updateData['company_logo'] = $filename;
                }
            }
        }
        // Option B: Standard multipart UploadedFile
        elseif ($request->hasFile('company_logo') && $request->file('company_logo')->isValid()) {
            if ($setting->company_logo && Storage::disk('public')->exists($setting->company_logo)) {
                Storage::disk('public')->delete($setting->company_logo);
            }
            Storage::disk('public')->makeDirectory('logos');
            $path = $request->file('company_logo')->store('logos', 'public');
            $updateData['company_logo'] = $path;
        }
        // Option C: Remove logo
        elseif ($request->boolean('remove_logo')) {
            if ($setting->company_logo && Storage::disk('public')->exists($setting->company_logo)) {
                Storage::disk('public')->delete($setting->company_logo);
            }
            $updateData['company_logo'] = null;
        }

        $setting->update($updateData);

        return redirect()->back()->with('success', 'Company profile and clinic details updated successfully!');
    }

    public function configuration(): Response
    {
        $setting = CompanySetting::getSettings();

        return Inertia::render('Settings/Configuration', [
            'setting' => $setting,
        ]);
    }

    public function updateConfiguration(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'token_print_size' => ['required', 'in:80mm,58mm,a5,a4'],
            'print_separate_slips' => ['boolean'],
            'token_header_note' => ['nullable', 'string', 'max:255'],
            'token_footer_note' => ['nullable', 'string', 'max:500'],
        ]);

        $setting = CompanySetting::getSettings();

        $setting->update([
            'token_print_size' => $validated['token_print_size'],
            'print_separate_slips' => $request->boolean('print_separate_slips', true),
            'token_header_note' => $validated['token_header_note'] ?? null,
            'token_footer_note' => $validated['token_footer_note'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Print configuration and token settings updated successfully!');
    }
}

