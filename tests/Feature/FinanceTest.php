<?php

namespace Tests\Feature;

use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    private function createAdminUser(): User
    {
        return User::create([
            'name' => 'Admin User',
            'phone' => '01711000000',
            'role' => 'admin',
            'password' => bcrypt('password'),
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('finance.banks.index'))->assertRedirect(route('login'));
        $this->get(route('finance.mobile-banking.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_bank_accounts_page(): void
    {
        $user = $this->createAdminUser();

        BankAccount::create([
            'type' => BankAccount::TYPE_BANK,
            'bank_name' => 'City Bank PLC',
            'account_name' => 'Clinic Operations',
            'account_number' => '1102938475',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get(route('finance.banks.index'));

        $response->assertStatus(200);
        $response->assertSee('City Bank PLC');
        $response->assertSee('Clinic Operations');
        $response->assertSee('1102938475');
    }

    public function test_authenticated_user_can_create_update_and_delete_bank_account(): void
    {
        $user = $this->createAdminUser();

        // Create bank account
        $storeResponse = $this->actingAs($user)->post(route('finance.banks.store'), [
            'bank_name' => 'Dutch-Bangla Bank',
            'account_name' => 'Diagnostic Center Ltd',
            'account_number' => '102.120.45678',
            'is_active' => true,
        ]);

        $storeResponse->assertRedirect(route('finance.banks.index'));
        $this->assertDatabaseHas('bank_accounts', [
            'type' => 'bank',
            'bank_name' => 'Dutch-Bangla Bank',
            'account_name' => 'Diagnostic Center Ltd',
            'account_number' => '102.120.45678',
            'is_active' => 1,
        ]);

        $account = BankAccount::where('type', 'bank')->firstOrFail();

        // Update bank account
        $updateResponse = $this->actingAs($user)->put(route('finance.banks.update', $account->id), [
            'bank_name' => 'Dutch-Bangla Bank PLC',
            'account_name' => 'Diagnostic Center Ltd (Main)',
            'account_number' => '102.120.45679',
            'is_active' => false,
        ]);

        $updateResponse->assertRedirect(route('finance.banks.index'));
        $this->assertDatabaseHas('bank_accounts', [
            'id' => $account->id,
            'bank_name' => 'Dutch-Bangla Bank PLC',
            'account_name' => 'Diagnostic Center Ltd (Main)',
            'account_number' => '102.120.45679',
            'is_active' => 0,
        ]);

        // Delete bank account
        $deleteResponse = $this->actingAs($user)->delete(route('finance.banks.destroy', $account->id));
        $deleteResponse->assertRedirect(route('finance.banks.index'));

        $this->assertSoftDeleted('bank_accounts', [
            'id' => $account->id,
        ]);
    }

    public function test_authenticated_user_can_view_mobile_banking_page(): void
    {
        $user = $this->createAdminUser();

        BankAccount::create([
            'type' => BankAccount::TYPE_MOBILE_BANKING,
            'bank_name' => 'bKash',
            'account_name' => 'bKash Merchant',
            'account_number' => '01711223344',
            'account_type' => 'Merchant',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get(route('finance.mobile-banking.index'));

        $response->assertStatus(200);
        $response->assertSee('bKash');
        $response->assertSee('bKash Merchant');
        $response->assertSee('01711223344');
        $response->assertSee('Merchant');
    }

    public function test_authenticated_user_can_create_update_and_delete_mobile_banking_account(): void
    {
        $user = $this->createAdminUser();

        // Create mobile banking account
        $storeResponse = $this->actingAs($user)->post(route('finance.mobile-banking.store'), [
            'bank_name' => 'Nagad',
            'account_name' => 'Nagad Personal',
            'account_number' => '01899887766',
            'account_type' => 'Personal',
            'is_active' => true,
        ]);

        $storeResponse->assertRedirect(route('finance.mobile-banking.index'));
        $this->assertDatabaseHas('bank_accounts', [
            'type' => 'mobile_banking',
            'bank_name' => 'Nagad',
            'account_name' => 'Nagad Personal',
            'account_number' => '01899887766',
            'account_type' => 'Personal',
            'is_active' => 1,
        ]);

        $account = BankAccount::where('type', 'mobile_banking')->firstOrFail();

        // Update mobile banking account
        $updateResponse = $this->actingAs($user)->put(route('finance.mobile-banking.update', $account->id), [
            'bank_name' => 'Nagad Islamic',
            'account_name' => 'Nagad Agent',
            'account_number' => '01899887755',
            'account_type' => 'Agent',
            'is_active' => false,
        ]);

        $updateResponse->assertRedirect(route('finance.mobile-banking.index'));
        $this->assertDatabaseHas('bank_accounts', [
            'id' => $account->id,
            'bank_name' => 'Nagad Islamic',
            'account_name' => 'Nagad Agent',
            'account_number' => '01899887755',
            'account_type' => 'Agent',
            'is_active' => 0,
        ]);

        // Delete mobile banking account
        $deleteResponse = $this->actingAs($user)->delete(route('finance.mobile-banking.destroy', $account->id));
        $deleteResponse->assertRedirect(route('finance.mobile-banking.index'));

        $this->assertSoftDeleted('bank_accounts', [
            'id' => $account->id,
        ]);
    }

    public function test_both_bank_and_mobile_banking_share_the_same_table(): void
    {
        $user = $this->createAdminUser();

        $this->actingAs($user)->post(route('finance.banks.store'), [
            'bank_name' => 'BRAC Bank',
            'account_name' => 'HQ Account',
            'account_number' => '5544332211',
            'is_active' => true,
        ]);

        $this->actingAs($user)->post(route('finance.mobile-banking.store'), [
            'account_name' => 'Rocket Merchant',
            'account_number' => '01911223344',
            'account_type' => 'Merchant',
            'is_active' => true,
        ]);

        // Assert 2 rows in bank_accounts table
        $this->assertDatabaseCount('bank_accounts', 2);

        // Bank query only finds bank
        $bankAccounts = BankAccount::bank()->get();
        $this->assertCount(1, $bankAccounts);
        $this->assertEquals('BRAC Bank', $bankAccounts->first()->bank_name);

        // Mobile query only finds mobile banking
        $mobileAccounts = BankAccount::mobileBanking()->get();
        $this->assertCount(1, $mobileAccounts);
        $this->assertEquals('Rocket Merchant', $mobileAccounts->first()->account_name);
        $this->assertEquals('01911223344', $mobileAccounts->first()->account_number);
    }
}

