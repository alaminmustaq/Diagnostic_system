<?php

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    /**
     * Display a listing of bank accounts.
     */
    public function bankIndex(): Response
    {
        $accounts = BankAccount::bank()
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Finance/Bank', [
            'accounts' => $accounts,
        ]);
    }

    /**
     * Store a newly created bank account in storage.
     */
    public function bankStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        BankAccount::create([
            'type' => BankAccount::TYPE_BANK,
            'bank_name' => $validated['bank_name'],
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('finance.banks.index')->with('success', 'Bank account created successfully.');
    }

    /**
     * Update the specified bank account in storage.
     */
    public function bankUpdate(Request $request, int $id): RedirectResponse
    {
        $account = BankAccount::bank()->findOrFail($id);

        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $account->update([
            'bank_name' => $validated['bank_name'],
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'is_active' => $request->boolean('is_active', $account->is_active),
        ]);

        return redirect()->route('finance.banks.index')->with('success', 'Bank account updated successfully.');
    }

    /**
     * Remove the specified bank account from storage.
     */
    public function destroyBank(int $id): RedirectResponse
    {
        $account = BankAccount::bank()->findOrFail($id);
        $account->delete();

        return redirect()->route('finance.banks.index')->with('success', 'Bank account deleted successfully.');
    }

    /**
     * Display a listing of mobile banking accounts.
     */
    public function mobileBankingIndex(): Response
    {
        $accounts = BankAccount::mobileBanking()
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Finance/MobileBanking', [
            'accounts' => $accounts,
        ]);
    }

    /**
     * Store a newly created mobile banking account in storage.
     */
    public function mobileBankingStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['nullable', 'string', 'max:255'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:100'],
            'account_type' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        BankAccount::create([
            'type' => BankAccount::TYPE_MOBILE_BANKING,
            'bank_name' => $validated['bank_name'] ?? null,
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'account_type' => $validated['account_type'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('finance.mobile-banking.index')->with('success', 'Mobile banking account created successfully.');
    }

    /**
     * Update the specified mobile banking account in storage.
     */
    public function mobileBankingUpdate(Request $request, int $id): RedirectResponse
    {
        $account = BankAccount::mobileBanking()->findOrFail($id);

        $validated = $request->validate([
            'bank_name' => ['nullable', 'string', 'max:255'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'max:100'],
            'account_type' => ['required', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $account->update([
            'bank_name' => $validated['bank_name'] ?? null,
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'account_type' => $validated['account_type'],
            'is_active' => $request->boolean('is_active', $account->is_active),
        ]);

        return redirect()->route('finance.mobile-banking.index')->with('success', 'Mobile banking account updated successfully.');
    }

    /**
     * Remove the specified mobile banking account from storage.
     */
    public function destroyMobileBanking(int $id): RedirectResponse
    {
        $account = BankAccount::mobileBanking()->findOrFail($id);
        $account->delete();

        return redirect()->route('finance.mobile-banking.index')->with('success', 'Mobile banking account deleted successfully.');
    }
}

