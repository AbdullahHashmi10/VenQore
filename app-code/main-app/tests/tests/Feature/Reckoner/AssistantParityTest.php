<?php

namespace Tests\Feature\Reckoner;

use App\Http\Controllers\AiController;
use App\Models\Account;
use App\Models\Category;
use App\Models\Expense;
use App\Models\JournalEntry;
use App\Models\JournalItem;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Stock;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use ReflectionMethod;
use Tests\Feature\VenQoreTestCase;

class AssistantParityTest extends VenQoreTestCase
{
    public function test_assistant_tools_agree_with_reckoner_readings(): void
    {
        $tenant = $this->createTenant();
        $user   = $this->createTenantUser($tenant, 'owner');
        $this->bindTenantContext($tenant, $user);
        Auth::login($user);

        $now = Carbon::now();
        $startDate = $now->copy()->startOfMonth()->format('Y-m-d');
        $endDate   = $now->copy()->endOfMonth()->format('Y-m-d');

        // 1. Seed Category and Product with Stock
        $category = Category::create([
            'tenant_id' => $tenant->id,
            'name'      => 'General Goods',
        ]);

        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'category_id' => $category->id,
            'name'        => 'Super Basmati Rice 5kg',
            'sku'         => 'RICE-5KG-' . uniqid(),
            'barcode'     => '89640001' . rand(1000, 9999),
            'cost'        => 600.00,
            'price'       => 1000.00,
            'unit'        => 'bag',
            'is_active'   => true,
        ]);

        Stock::create([
            'tenant_id'   => $tenant->id,
            'product_id'  => $product->id,
            'quantity'    => 50,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // 2. Seed Customer Party with Receivable Balance
        $customer = Party::create([
            'tenant_id'       => $tenant->id,
            'name'            => 'Tariq Retailers',
            'type'            => 'customer',
            'phone'           => '03001234567',
            'opening_balance' => 1500.00,
        ]);

        // 3. Seed Posted Sale
        $sale = Sale::create([
            'tenant_id'        => $tenant->id,
            'user_id'          => $user->id,
            'party_id'         => $customer->id,
            'reference_number' => 'SALE-PARITY-' . uniqid(),
            'status'           => 'posted',
            'posted_at'        => $now,
            'subtotal'         => 2000.00,
            'net_sales'        => 2000.00,
            'tax'              => 0.00,
            'total'            => 2000.00,
            'payment_method'   => 'cash',
            'created_at'       => $now,
            'updated_at'       => $now,
        ]);

        SaleItem::create([
            'tenant_id'   => $tenant->id,
            'sale_id'     => $sale->id,
            'product_id'  => $product->id,
            'quantity'    => 2,
            'unit_price'  => 1000.00,
            'total_price' => 2000.00,
        ]);

        // 4. Seed Operating Expense
        Expense::create([
            'tenant_id'   => $tenant->id,
            'category'    => 'Utilities',
            'amount'      => 300.00,
            'date'        => $now->format('Y-m-d'),
            'description' => 'Electricity bill',
        ]);

        // 5. Seed Authoritative Double-Entry Ledger
        $cashAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '1000'],
            ['name' => 'Cash on Hand', 'type' => 'asset', 'balance' => 2000.00]
        );
        $arAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '1200'],
            ['name' => 'Accounts Receivable', 'type' => 'accounts_receivable', 'balance' => 1500.00]
        );
        $invAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '1300'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'balance' => 28800.00]
        );
        $salesAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '4000'],
            ['name' => 'Sales Revenue', 'type' => 'revenue', 'balance' => 2000.00]
        );
        $cogsAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '5000'],
            ['name' => 'Cost of Goods Sold', 'type' => 'expense', 'balance' => 1200.00]
        );
        $equityAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '3000'],
            ['name' => 'Opening Equity', 'type' => 'equity', 'balance' => 1500.00]
        );
        $expAcc = Account::firstOrCreate(
            ['tenant_id' => $tenant->id, 'code' => '6000'],
            ['name' => 'Operating Expenses', 'type' => 'expense', 'balance' => 300.00]
        );

        $journal = JournalEntry::create([
            'tenant_id'   => $tenant->id,
            'user_id'     => $user->id,
            'reference'   => 'JE-PARITY-' . uniqid(),
            'date'        => $now->format('Y-m-d'),
            'description' => 'Parity Seed Journal',
            'status'      => 'posted',
        ]);

        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $journal->id, 'account_id' => $cashAcc->id, 'debit' => 2000.00, 'credit' => 0.0]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $journal->id, 'account_id' => $salesAcc->id, 'debit' => 0.0, 'credit' => 2000.00]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $journal->id, 'account_id' => $cogsAcc->id, 'debit' => 1200.00, 'credit' => 0.0]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $journal->id, 'account_id' => $invAcc->id, 'debit' => 0.0, 'credit' => 1200.00]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $journal->id, 'account_id' => $expAcc->id, 'debit' => 300.00, 'credit' => 0.0]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $journal->id, 'account_id' => $cashAcc->id, 'debit' => 0.0, 'credit' => 300.00]);

        // Customer Opening Receivable Journal Entry
        $arJournal = JournalEntry::create([
            'tenant_id'   => $tenant->id,
            'user_id'     => $user->id,
            'reference'   => 'JE-AR-' . uniqid(),
            'date'        => $now->format('Y-m-d'),
            'description' => 'Customer Opening Receivable',
            'status'      => 'posted',
        ]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $arJournal->id, 'account_id' => $arAcc->id, 'party_id' => $customer->id, 'debit' => 1500.00, 'credit' => 0.0]);
        JournalItem::create(['tenant_id' => $tenant->id, 'journal_entry_id' => $arJournal->id, 'account_id' => $equityAcc->id, 'party_id' => $customer->id, 'debit' => 0.0, 'credit' => 1500.00]);

        Cache::flush();
        Reckoner::forgetCapabilities($tenant->id);

        $reckoner = app(Reckoner::class);
        $aiController = new AiController();
        $refMethod = new ReflectionMethod(AiController::class, 'executeFunction');
        $refMethod->setAccessible(true);

        // ── A. Revenue Parity ───────────────────────────────────────────────
        $reckonerRevReq = new ReckonerRequest('sales.revenue', 'custom', ['from' => $startDate, 'to' => $endDate]);
        $reckonerRev = $reckoner->read($reckonerRevReq, $user, $tenant);
        $this->assertTrue($reckonerRev->ok);
        $reckonerRevVal = (float) (is_array($reckonerRev->data) ? ($reckonerRev->data['value'] ?? 0) : $reckonerRev->data);

        $aiSalesJson = $refMethod->invoke($aiController, 'get_sales_summary', [
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ]);
        $aiSales = json_decode($aiSalesJson, true);
        $this->assertEquals($reckonerRevVal, (float) $aiSales['total_amount'], 'AI get_sales_summary total_amount must match Reckoner sales.revenue');

        // ── B. Profit Parity ────────────────────────────────────────────────
        $reckonerProfitReq = new ReckonerRequest('finance.net_profit', 'custom', ['from' => $startDate, 'to' => $endDate]);
        $reckonerProfit = $reckoner->read($reckonerProfitReq, $user, $tenant);
        $this->assertTrue($reckonerProfit->ok);
        $reckonerProfitVal = (float) (is_array($reckonerProfit->data) ? ($reckonerProfit->data['value'] ?? 0) : $reckonerProfit->data);

        $aiProfitJson = $refMethod->invoke($aiController, 'get_profit_summary', [
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ]);
        $aiProfit = json_decode($aiProfitJson, true);
        $this->assertEquals($reckonerProfitVal, (float) $aiProfit['profit'], 'AI get_profit_summary profit must match Reckoner finance.net_profit');

        // ── C. Stock Level Parity ───────────────────────────────────────────
        $aiStockJson = $refMethod->invoke($aiController, 'get_stock_level', [
            'product_name' => 'Super Basmati',
        ]);
        $aiStock = json_decode($aiStockJson, true);
        $this->assertEquals(50.0, (float) $aiStock['stock'], 'AI get_stock_level must report correct FIFO stock sum');

        // ── D. Party Balance Parity ─────────────────────────────────────────
        $aiPartyJson = $refMethod->invoke($aiController, 'get_party_balance', [
            'party_name' => 'Tariq',
        ]);
        $aiParty = json_decode($aiPartyJson, true);
        $this->assertEquals(1500.00, (float) $aiParty['balance'], 'AI get_party_balance must report correct party balance');
    }
}
