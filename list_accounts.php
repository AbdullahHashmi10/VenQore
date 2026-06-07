<?php

foreach (\App\Models\Account::where('code', 'LIKE', '101%')->orWhere('code', 'LIKE', '100%')->get() as $a) {
    echo "{$a->code}: {$a->name}\n";
}
