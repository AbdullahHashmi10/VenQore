<?php
use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";

try {
    $pdo = new \PDO("sqlite:" . $vypPath);
    $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

    DB::beginTransaction();

    echo "Importing Categories...\n";
    $catMap = [];
    $stmt = $pdo->query("SELECT * FROM kb_item_categories");
    while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
        $name = $row['item_category_name'];
        $code = Str::slug($name);
        
        $cat = Category::firstOrCreate(
            ['name' => $name],
            ['code' => $code]
        );
        $catMap[$row['item_category_id']] = $cat->id;
    }
    echo "Imported " . count($catMap) . " categories.\n";

    echo "Linking Products to Categories via kb_item_categories_mapping...\n";
    
    // Get mappings
    $stmt = $pdo->query("SELECT * FROM kb_item_categories_mapping");
    $mappings = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    
    // Also need item codes/names to find products since IDs might differ from import
    // But since we did a clean import, we might have lost original IDs if not careful.
    // Let's assume restore_vyapar_manual.php didn't save original IDs map.
    // Wait, restore_vyapar_manual.php did NOT save an ID map for later use.
    // SO we must refetch items from Vyapar to match ID -> Name -> Product.
    
    $itemMap = []; // Vyapar Item ID -> Product Model (match by Name or Code)
    $iStmt = $pdo->query("SELECT item_id, item_name, item_code FROM kb_items");
    while ($row = $iStmt->fetch(\PDO::FETCH_ASSOC)) {
        $itemMap[$row['item_id']] = [
            'name' => $row['item_name'],
            'code' => $row['item_code']
        ];
    }
    
    $count = 0;
    foreach ($mappings as $map) {
        $vItemId = $map['item_id'];
        $vCatId = $map['category_id'];
        
        if (isset($catMap[$vCatId]) && isset($itemMap[$vItemId])) {
            $catId = $catMap[$vCatId];
            $itemInfo = $itemMap[$vItemId];
            
            // Find Local Product
            $product = null;
            if (!empty($itemInfo['code'])) {
                $product = Product::where('sku', $itemInfo['code'])->first();
            }
            if (!$product && !empty($itemInfo['name'])) {
                $product = Product::where('name', $itemInfo['name'])->first();
            }
            
            if ($product) {
                $product->update(['category_id' => $catId]);
                $count++;
            }
        }
    }
    
    echo "Updated $count products with categories.\n";

    DB::commit();
    echo "Category Import Successful!\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
}
