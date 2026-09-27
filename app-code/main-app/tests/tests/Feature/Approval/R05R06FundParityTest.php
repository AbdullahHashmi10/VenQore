<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\ApprovalRevision;
use App\Models\BankAccount;
use App\Models\FundTransaction;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\Adapters\CapitalInjectionApprovalAdapter;
use App\Services\Approval\Adapters\OwnerDrawingsApprovalAdapter;
use App\Services\Approval\Adapters\FundTransferApprovalAdapter;
use Tests\Feature\VenQoreTestCase;

class R05R06FundParityTest extends VenQoreTestCase
{
    public function test_capital_injection_accepts_account_type_and_creates_fund_transaction(): void
    {
        $tenant = $this->createTenant('r05-cap-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'accountant');
        $reviewer = $this->createTenantUser($tenant, 'owner');

        $bankAccount = BankAccount::create([
            'tenant_id'       => $tenant->id,
            'name'            => 'Meezan Bank Ltd',
            'bank_name'       => 'Meezan Bank',
            'account_number'  => 'PK88MEZN00012345678901',
            'account_type'    => 'current',
            'opening_balance' => 0.00,
            'current_balance' => 0.00,
        ]);

        $adapter = app(CapitalInjectionApprovalAdapter::class);

        // Real form payload sends account_type: 'bank' and bank_account_id
        $payload = [
            'amount'          => 50000.00,
            'account_type'    => 'bank',
            'bank_account_id' => $bankAccount->id,
            'reason'          => 'Initial seed capital',
        ];

        $validated = $adapter->validatePayload($payload, $tenant, $maker);
        $this->assertSame('bank', $validated['payment_method'], 'R05: account_type alias must normalize to payment_method');
        $this->assertSame($bankAccount->id, $validated['bank_account_id']);

        // Post through approval adapter
        $doc = ApprovalDocument::create([
            'tenant_id'     => $tenant->id,
            'document_type' => ApprovalDocument::TYPE_CAPITAL_INJECTION,
            'status'        => ApprovalDocument::STATUS_PENDING,
            'maker_id'      => $maker->id,
            'amount'        => 50000.00,
            'version'       => 1,
        ]);
        $rev = ApprovalRevision::create([
            'approval_document_id' => $doc->id,
            'revision_number'      => 1,
            'maker_id'             => $maker->id,
            'payload'              => $validated,
        ]);
        $doc->update(['current_revision_id' => $rev->id]);

        $result = $adapter->post($doc, $tenant, $reviewer);
        $this->assertNotEmpty($result['journal_entry_id']);

        // R06 check: FundTransaction record must exist for bank balance parity
        $tx = FundTransaction::where('tenant_id', $tenant->id)
            ->where('to_account_id', $bankAccount->id)
            ->where('type', 'add')
            ->first();

        $this->assertNotNull($tx, 'R06: FundTransaction type=add must be recorded for bank capital injection');
        $this->assertEquals(50000.00, (float)$tx->amount);
    }

    public function test_owner_drawings_accepts_account_type_and_creates_fund_transaction(): void
    {
        $tenant = $this->createTenant('r05-draw-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'accountant');
        $reviewer = $this->createTenantUser($tenant, 'owner');

        $bankAccount = BankAccount::create([
            'tenant_id'       => $tenant->id,
            'name'            => 'HBL Main',
            'bank_name'       => 'HBL',
            'account_number'  => 'PK88HBLB00098765432101',
            'account_type'    => 'current',
            'opening_balance' => 100000.00,
            'current_balance' => 100000.00,
        ]);

        $adapter = app(OwnerDrawingsApprovalAdapter::class);

        $payload = [
            'amount'          => 15000.00,
            'account_type'    => 'bank',
            'bank_account_id' => $bankAccount->id,
            'reason'          => 'Personal drawing',
        ];

        $validated = $adapter->validatePayload($payload, $tenant, $maker);
        $this->assertSame('bank', $validated['payment_method'], 'R05: account_type alias must normalize to payment_method');

        $doc = ApprovalDocument::create([
            'tenant_id'     => $tenant->id,
            'document_type' => ApprovalDocument::TYPE_OWNER_DRAWINGS,
            'status'        => ApprovalDocument::STATUS_PENDING,
            'maker_id'      => $maker->id,
            'amount'        => 15000.00,
            'version'       => 1,
        ]);
        $rev = ApprovalRevision::create([
            'approval_document_id' => $doc->id,
            'revision_number'      => 1,
            'maker_id'             => $maker->id,
            'payload'              => $validated,
        ]);
        $doc->update(['current_revision_id' => $rev->id]);

        $result = $adapter->post($doc, $tenant, $reviewer);
        $this->assertNotEmpty($result['journal_entry_id']);

        $tx = FundTransaction::where('tenant_id', $tenant->id)
            ->where('from_account_id', $bankAccount->id)
            ->where('type', 'remove')
            ->first();

        $this->assertNotNull($tx, 'R06: FundTransaction type=remove must be recorded for bank owner drawings');
        $this->assertEquals(15000.00, (float)$tx->amount);
    }
}
