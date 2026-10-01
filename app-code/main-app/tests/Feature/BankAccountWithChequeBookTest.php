<?php

namespace Tests\Feature;

use App\Http\Controllers\FinanceController;
use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Tests\TestCase;

class BankAccountWithChequeBookTest extends TestCase
{
    use DatabaseTransactions;

    protected Tenant $tenant;
    protected User $owner;
    protected FinanceController $controller;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name'            => 'Bank Test Store',
            'slug'            => 'bank-test-store-' . uniqid(),
            'status'          => 'active',
            'setup_completed' => true,
        ]);
        app()->instance('current.tenant', $this->tenant);

        $this->owner = User::factory()->create([
            'email'             => 'bankowner-' . uniqid() . '@example.com',
            'email_verified_at' => now(),
        ]);
        TenantUser::create([
            'tenant_id'                 => $this->tenant->id,
            'user_id'                   => $this->owner->id,
            'role'                      => 'owner',
            'status'                    => 'active',
            'permissions'               => ['*'],
            'transaction_approval_mode' => 'direct',
        ]);
        $this->actingAs($this->owner);
        session(['current_tenant_id' => $this->tenant->id]);

        $this->controller = new FinanceController();
    }

    public function test_can_create_bank_account_without_cheque_book(): void
    {
        $request = Request::create('/bank-accounts', 'POST', [
            'name'            => 'Primary Checking Account',
            'bank_name'       => 'Habib Bank Limited',
            'account_number'  => 'PK36HABB00001234567890',
            'account_type'    => 'checking',
            'opening_balance' => 5000,
            'notes'           => 'Main operating account',
        ]);
        $request->setUserResolver(fn () => $this->owner);

        $response = $this->controller->storeBankAccount($request);
        $data = $response->getData(true);

        $this->assertTrue($data['success']);
        $this->assertDatabaseHas('bank_accounts', [
            'tenant_id' => $this->tenant->id,
            'name'      => 'Primary Checking Account',
            'bank_name' => 'Habib Bank Limited',
        ]);
    }

    public function test_can_create_bank_account_with_inline_cheque_book(): void
    {
        $request = Request::create('/bank-accounts', 'POST', [
            'name'                      => 'Corporate HBL Account',
            'bank_name'                 => 'HBL',
            'account_number'            => 'PK36HABB00009999999999',
            'account_type'              => 'checking',
            'opening_balance'           => 10000,
            'add_cheque_book'           => true,
            'cheque_book_prefix'        => 'HBL',
            'cheque_book_start_number'  => 100001,
            'cheque_book_end_number'    => 100025,
            'cheque_book_padding_zeros' => 6,
            'cheque_book_notes'         => 'Initial 25-Leaf Corporate Book',
        ]);
        $request->setUserResolver(fn () => $this->owner);

        $response = $this->controller->storeBankAccount($request);
        $data = $response->getData(true);

        $this->assertTrue($data['success']);
        $this->assertSame(25, $data['chequeBook']['total_leaves']);

        $bankAccountId = $data['bankAccount']['id'];
        $this->assertNotNull($bankAccountId);

        // Verify Cheque Book created in DB
        $chequeBook = ChequeBook::where('tenant_id', $this->tenant->id)
            ->where('bank_account_id', $bankAccountId)
            ->first();

        $this->assertNotNull($chequeBook);
        $this->assertSame('HBL', $chequeBook->prefix);
        $this->assertSame(100001, $chequeBook->serial_start);
        $this->assertSame(100025, $chequeBook->serial_end);
        $this->assertSame(25, $chequeBook->total_leaves);

        // Verify individual leaves generated atomically
        $leafCount = ChequeLeaf::where('tenant_id', $this->tenant->id)
            ->where('cheque_book_id', $chequeBook->id)
            ->count();
        $this->assertSame(25, $leafCount);

        // Verify leaf serial formatting
        $firstLeaf = ChequeLeaf::where('tenant_id', $this->tenant->id)
            ->where('cheque_book_id', $chequeBook->id)
            ->orderBy('numeric_serial', 'asc')
            ->first();

        $this->assertSame('HBL-100001', $firstLeaf->display_serial_number);
        $this->assertSame(ChequeLeaf::STATUS_AVAILABLE, $firstLeaf->status);
    }

    public function test_validates_cheque_book_start_and_end_range(): void
    {
        $request = Request::create('/bank-accounts', 'POST', [
            'name'                     => 'Meezan Account',
            'bank_name'                => 'Meezan Bank',
            'account_type'             => 'checking',
            'add_cheque_book'          => true,
            'cheque_book_start_number' => 200,
            'cheque_book_end_number'   => 100, // Invalid: end < start
        ]);
        $request->setUserResolver(fn () => $this->owner);

        try {
            $response = $this->controller->storeBankAccount($request);
            $data = $response->getData(true);
            $this->assertFalse($data['success']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->assertArrayHasKey('cheque_book_end_number', $e->errors());
        }
    }
}
