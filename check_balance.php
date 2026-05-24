<?php
foreach (\App\Models\BankAccount::all() as $b) {
    echo $b->name . ': ' . $b->v3Balance() . "\n";
}
