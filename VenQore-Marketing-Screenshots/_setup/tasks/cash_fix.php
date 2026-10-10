<?php
header('Content-Type: text/plain');
$acc = app(App\Engines\AccountingService::class);
$bal0 = $acc->getBalance('1000');
$je = $acc->createEntry(['date'=>'2025-10-01','reference_type'=>'opening_balance','reference'=>'OB-CAPITAL-001','description'=>'Owner capital contribution','created_by'=>auth()->id()], [
  ['account_code'=>'1000','debit'=>4000000,'credit'=>0],['account_code'=>'3000','debit'=>0,'credit'=>4000000]]);
echo "cash before $bal0 after ".$acc->getBalance('1000')."\n";
