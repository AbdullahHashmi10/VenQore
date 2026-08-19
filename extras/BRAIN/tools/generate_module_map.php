<?php
/*
| Regenerates MODULE_MAP.md from config/modules.php + the feature catalog.
|
| Run it after every registry change:
|     php tools/generate_module_map.php
|
| The map is GENERATED, never hand-edited. A hand-edited map drifts from the
| registry within a week, and then you have two sources of truth and no way to
| tell which is lying.
|
| Usage: php tools/generate_module_map.php [path/to/Features] [out.md]
*/

$root      = dirname(__DIR__);
$featDir   = $argv[1] ?? ($root.'/features');
$outFile   = $argv[2] ?? ($root.'/docs/MODULE_MAP.md');

$modules = require $root.'/config/modules.php';
$ai      = require $root.'/config/ai_builder.php';

// ---- parse the catalog for "N. Title" lines, with build status -------------
$catalog = [];
foreach (['venqore_built.md' => 'built', 'venqore_partial.md' => 'partial', 'venqore_coming_soon.md' => 'coming_soon'] as $file => $bucket) {
    $path = $featDir.'/'.$file;
    if (!is_file($path)) { continue; }
    foreach (file($path) as $line) {
        if (!preg_match('/^-\s+(\d+)\.\s+(.+?)\s+(?:—|-)\s*(🟢|🟡|🔴|✅)/u', trim($line), $m)) { continue; }
        $id = (int) $m[1];
        $icon = $m[3];
        $real = match (true) {
            $icon === '🟢' || $icon === '✅' => 'done',
            $icon === '🟡'                    => 'partial',
            default                           => 'excluded',
        };
        // Later files may re-state a feature; "done" always wins, because the
        // IDE marked it verified after the original audit.
        if (!isset($catalog[$id]) || $real === 'done') {
            $catalog[$id] = ['title' => $m[2], 'file' => $bucket, 'state' => $real];
        }
    }
}

$mark = ['done' => '✅', 'partial' => '🟡', 'excluded' => '⛔'];
$groupNames = [
    'A' => 'GROUP A — WHAT AM I SELLING?',
    'B' => 'GROUP B — SELLING',
    'C' => 'GROUP C — STOCK',
    'D' => 'GROUP D — BUYING',
    'E' => 'GROUP E — MAKING',
    'F' => 'GROUP F — MONEY',
    'G' => 'GROUP G — GROWTH & OPERATIONS',
];

$out = [];
$out[] = '# VENQORE — THE MODULE MAP';
$out[] = '## 46 modules, what lives inside each, and what each one opens';
$out[] = '';
$out[] = '> **Generated from `config/modules.php` by `tools/generate_module_map.php`. Do not edit by hand — edit the registry and regenerate.**';
$out[] = '> Generated '.date('j F Y').'.';
$out[] = '';
$out[] = 'This is the human-readable face of the brain. The registry is what the code reads; this is what a person reads when they want to know what VenQore actually does.';
$out[] = '';

// ---- summary ---------------------------------------------------------------
$byStatus = [];
foreach ($modules as $m) { $byStatus[$m['status']] = ($byStatus[$m['status']] ?? 0) + 1; }
$included = count(array_filter($modules, fn ($m) => $m['billing'] === 'included'));
$mapped   = [];
foreach ($modules as $m) { $mapped = array_merge($mapped, $m['features']); }
$mapped   = array_unique($mapped);
$openVerify = array_sum(array_map(fn ($m) => count($m['verify']), $modules));

$out[] = '## At a glance';
$out[] = '';
$out[] = '| | |';
$out[] = '|---|---|';
$out[] = '| Modules | **'.count($modules).'** |';
$out[] = '| Free on every plan | **'.$included.'** |';
$out[] = '| Metered or paid add-on | '.(count($modules) - $included).' |';
foreach ($byStatus as $s => $n) { $out[] = '| Status `'.$s.'` | '.$n.' |'; }
$out[] = '| Catalog features mapped into a module | '.count($mapped).' |';
$out[] = '| Open `verify` items across the registry | **'.$openVerify.'** |';
$out[] = '| Presets | '.count($ai['presets']).' |';
$out[] = '';
$out[] = 'Every open `verify` item is a specific, named doubt written into the registry. Clear them as you confirm each one in a browser; a module whose `verify` array is empty and whose status is `live` is a module you can sell without flinching.';
$out[] = '';

// ---- the modules -----------------------------------------------------------
foreach ($groupNames as $g => $title) {
    $out[] = '---';
    $out[] = '';
    $out[] = '# '.$title;
    $out[] = '';

    foreach ($modules as $key => $m) {
        if ($m['group'] !== $g) { continue; }

        $badge = match ($m['status']) {
            'live'     => '🟢 live',
            'beta'     => '🟡 beta — never in a preset, never proposed by the AI',
            'building' => '🔨 building — not shippable yet',
            'planned'  => '⚪ planned',
            'retired'  => '⚫ retired',
        };
        $bill = match ($m['billing']) {
            'included' => 'Free on every plan',
            'metered'  => '**Metered** — allowance then capped',
            'addon'    => '**Paid add-on**',
        };

        $out[] = '## '.$m['id'].'. '.$m['label'].'  `'.$key.'`';
        $out[] = '';
        $out[] = '*'.$m['description'].'*';
        $out[] = '';
        $out[] = '| | |';
        $out[] = '|---|---|';
        $out[] = '| Status | '.$badge.' |';
        $out[] = '| Billing | '.$bill.' |';
        $out[] = '| Needs | '.($m['requires'] ? '`'.implode('`, `', $m['requires']).'`' : '— nothing').' |';
        if ($m['requires_one']) {
            $sets = array_map(fn ($s) => '`'.implode('` **or** `', $s).'`', $m['requires_one']);
            $out[] = '| Needs one of | '.implode(' — and — ', $sets).' |';
        }
        $out[] = '| Works well with | '.($m['enhances'] ? '`'.implode('`, `', $m['enhances']).'`' : '—').' |';
        $out[] = '| Opens | '.$m['opens'].' |';
        $out[] = '| Old plan gate to delete | '.($m['legacy_gate'] ? '`'.$m['legacy_gate'].'`' : '— none').' |';
        $out[] = '| People call it | '.implode(', ', array_map(fn ($a) => '"'.$a.'"', array_slice($m['aliases'], 0, 8))).' |';
        $out[] = '';

        if ($m['features']) {
            $out[] = '**What is inside it** ('.count($m['features']).' catalog features)';
            $out[] = '';
            $rows = [];
            foreach ($m['features'] as $fid) {
                $f = $catalog[$fid] ?? null;
                $rows[] = $f
                    ? '`#'.$fid.'` '.$mark[$f['state']].' '.$f['title']
                    : '`#'.$fid.'` — *not found in the catalog — check the number*';
            }
            $out[] = implode(' · ', $rows);
            $out[] = '';
        } else {
            $out[] = '**What is inside it** — nothing from the catalog yet.';
            $out[] = '';
        }

        if ($m['verify']) {
            $out[] = '**Before you can call this done ('.count($m['verify']).')**';
            $out[] = '';
            foreach ($m['verify'] as $v) { $out[] = '- '.$v; }
            $out[] = '';
        }
    }
}

// ---- dependency tree -------------------------------------------------------
$out[] = '---';
$out[] = '';
$out[] = '# The dependency tree';
$out[] = '';
$out[] = 'Read it downwards: a child cannot be switched on without its parent. Maximum depth is 4, which is the plan limit — if you ever need a fifth level, something modelled as `requires` is really an `enhances`.';
$out[] = '';
$out[] = '```';
$roots = array_filter($modules, fn ($m) => !$m['requires']);
$render = function (string $key, string $pad, array $seen) use (&$render, $modules, &$out) {
    $children = array_filter($modules, fn ($m, $k) => in_array($key, $m['requires'], true), ARRAY_FILTER_USE_BOTH);
    $keys = array_keys($children);
    foreach ($keys as $i => $child) {
        $last = ($i === count($keys) - 1);
        $out[] = $pad.($last ? '└── ' : '├── ').$child.' (#'.$modules[$child]['id'].')';
        $render($child, $pad.($last ? '    ' : '│   '), array_merge($seen, [$child]));
    }
};
foreach ($roots as $key => $m) {
    $out[] = $key.' (#'.$m['id'].')'.($m['requires_one'] ? '   [needs one of: '.implode(' | ', array_map(fn ($s) => implode('/', $s), $m['requires_one'])).']' : '');
    $render($key, '', [$key]);
}
$out[] = '```';
$out[] = '';

// ---- presets ---------------------------------------------------------------
$out[] = '---';
$out[] = '';
$out[] = '# Coverage — what real businesses land on';
$out[] = '';
$out[] = '| Business | Modules | Count | Ships when |';
$out[] = '|---|---|---|---|';
foreach ($ai['presets'] as $pk => $p) {
    $blocked = $p['blocked_by'] ?? [];
    $out[] = '| **'.$p['label'].'** | '.implode(', ', $p['modules']).' | **'.count($p['modules']).'** | '
        .($blocked ? 'blocked on `'.implode('`, `', $blocked).'`' : 'now').' |';
}
$out[] = '';
$out[] = 'Range: '.min(array_map(fn ($p) => count($p['modules']), $ai['presets'])).' to '.max(array_map(fn ($p) => count($p['modules']), $ai['presets'])).' modules, against a full ERP of 46. Nobody is forced into anything.';
$out[] = '';

// ---- features that belong to no module -------------------------------------
$unmapped = array_diff(array_keys($catalog), $mapped);
sort($unmapped);
$out[] = '---';
$out[] = '';
$out[] = '# Features that belong to no module ('.count($unmapped).')';
$out[] = '';
$out[] = 'Nothing here is lost — every one of these is either **platform** (always on, never a toggle), **Qore** (foundation, never visible), **frozen** for V1, or an **internal ops tool**. They are listed so that nobody rediscovers one in a month and adds a 47th module in a hurry.';
$out[] = '';
$out[] = '| # | Feature | Where it actually lives |';
$out[] = '|---|---|---|';
$placement = [
    // platform surfaces — always on, listed in config/qore.php always_on_routes
    1 => 'Platform', 2 => 'Platform (billing)', 3 => 'Platform', 4 => 'Platform (presets — see ai_builder.php)',
    5 => 'Platform (appearance)', 6 => 'Platform (appearance)', 7 => 'Platform (multi-store hub)',
    10 => 'Platform', 11 => 'Platform (onboarding)', 12 => 'Platform (billing)', 13 => 'Platform (hardware)',
    14 => 'Platform', 15 => 'Platform', 16 => 'Platform (ops)', 21 => 'Platform (accessibility)',
    22 => 'Platform (accessibility)', 51 => 'Customers #3 — statement generator', 80 => 'Suppliers #4 — statement generator',
    142 => 'FROZEN — charity/donations', 149 => 'Reports #42', 167 => 'Reports #42',
    235 => 'FROZEN — Smart Capture', 236 => 'FROZEN — bring-your-own-key',
    237 => 'QORE — tenancy', 238 => 'QORE — security zones', 239 => 'Internal ops tool, not a customer feature',
    240 => 'QORE — plan enforcement', 241 => 'QORE — plan gate caching', 242 => 'Internal ops tool',
    244 => 'Platform (demo)', 245 => 'Platform (recycle bin)', 248 => 'REPLACED BY THIS REGISTRY',
    249 => 'Platform (backups)', 254 => 'Platform (responsive CSS)', 255 => 'Excluded by your decision',
    256 => 'Excluded by your decision', 260 => 'Business tier and up — not a module',
    261 => 'Enterprise — not a module', 262 => 'Support commitment, not software',
    263 => 'Enterprise — not a module', 264 => 'Support commitment, not software',
    265 => 'Support commitment, not software',
];
foreach ($unmapped as $fid) {
    $f = $catalog[$fid];
    $out[] = '| '.$fid.' | '.$mark[$f['state']].' '.$f['title'].' | '.($placement[$fid] ?? '**UNPLACED — decide before launch**').' |';
}
$out[] = '';

// ---- catalog hygiene -------------------------------------------------------
$out[] = '---';
$out[] = '';
$out[] = '# Catalog hygiene notes';
$out[] = '';
$out[] = 'Found while mapping. None of these break anything, but each will waste somebody\'s afternoon eventually.';
$out[] = '';
$out[] = '- **Feature #72 is used twice** — "A4 & Letter Invoice PDF Export" in `venqore_built.md` and "Supplier Performance Score" in `venqore_coming_soon.md`. Renumber one of them.';
$out[] = '- **#93 appears twice inside `venqore_coming_soon.md`**, under both Communications and Landed Cost.';
$out[] = '- **Known duplicates by design**: #257 = #53, #258 = #75, #259 = #58/#76, #179 = #164, #182/#183 = #165, #92 = #189. Fine to keep, but they inflate the "265 features" number by about six.';
$out[] = '- The Partial and Coming Soon files now carry many `✅ Verified` lines. Those were folded in as **done** here, and every one is flagged in the registry\'s `verify` array rather than silently trusted.';
$out[] = '';

file_put_contents($outFile, implode("\n", $out)."\n");
echo "Wrote {$outFile} (".count($out)." lines, ".count($catalog)." catalog features parsed)\n";
