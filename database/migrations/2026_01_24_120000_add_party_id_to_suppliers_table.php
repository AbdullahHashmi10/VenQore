<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Party;
use App\Models\Supplier;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            // Add party_id column, nullable at first
            $table->foreignUuid('party_id')->nullable()->constrained('parties')->onDelete('set null');
        });

        // Initialize Mapping (Shadow Party Creation)
        // Ensure we retrieve all suppliers including deleted ones to fix references
        $suppliers = Supplier::withTrashed()->get();
        
        foreach ($suppliers as $supplier) {
            // Try to find an existing party with the same name and type
            $party = Party::where('type', 'supplier')
                ->where('name', $supplier->name)
                ->first();
            
            if (!$party) {
                // Create shadow party if it doesn't exist
                $party = Party::create([
                    'type' => 'supplier',
                    'name' => $supplier->name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'address' => $supplier->address,
                    'notes' => $supplier->notes,
                    'opening_balance' => 0, 
                    'opening_balance_type' => 'payable',
                    'current_balance' => 0 
                ]);
            }
            
            // Link supplier to party
            $supplier->party_id = $party->id;
            $supplier->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropForeign(['party_id']);
            $table->dropColumn('party_id');
        });
    }
};


