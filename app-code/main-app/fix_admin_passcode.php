<?php
$u = \App\Models\User::where('email', 'admin@amd.com')->first();
if ($u) {
    $u->passcode = '1967';
    $u->save();
    echo "Updated admin passcode to 1967";
} else {
    echo "Admin user not found";
}
