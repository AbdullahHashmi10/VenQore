<?php
$u = App\Models\User::withoutGlobalScopes()->where('email','owner-e2e@example.test')->first();
if (!$u) { $u = new App\Models\User(); $u->name='Owner E2E'; $u->email='owner-e2e@example.test'; }
$u->password = Hash::make('Str0ng!Passw0rd#2026');
$u->email_verified_at = now();
$u->forceFill(['is_platform_admin'=>true,'platform_role'=>'platform_owner','two_factor_secret'=>Crypt::encryptString('JBSWY3DPEHPK3PXP'),'two_factor_confirmed_at'=>now()]);
$u->save();
echo "ok\n";
