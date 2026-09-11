<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * AUTH-03 (2026-09-10): controlled creation of the platform owner.
 *
 * Replaces "the first public sign-up becomes Platform Owner". Run it on the
 * server (SSH / hosting terminal). Race-safe: runs in a transaction holding a
 * lock, and refuses if a platform owner already exists unless --additional.
 * The owner must enrol authenticator-app 2FA at first sign-in (Require2FA).
 *
 *   php artisan venqore:create-platform-owner owner@venqore.com --name="Rehan"
 */
class CreatePlatformOwner extends Command
{
    protected $signature = 'venqore:create-platform-owner
                            {email : Email address of the platform owner}
                            {--name= : Display name}
                            {--additional : Allow creating/promoting another owner when one already exists}';

    protected $description = 'Create (or promote) the VenQore platform owner account from the command line';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        if (Validator::make(['email' => $email], ['email' => 'required|email'])->fails()) {
            $this->error('Invalid email address.');
            return self::FAILURE;
        }

        $existingUser = User::where('email', $email)->first();
        $password = null;

        if (!$existingUser) {
            $password = (string) $this->secret('Password for the new owner (min 12 characters, not echoed)');
            $confirm  = (string) $this->secret('Repeat the password');
            if ($password !== $confirm) {
                $this->error('Passwords do not match.');
                return self::FAILURE;
            }
            $v = Validator::make(['password' => $password], [
                'password' => ['required', Password::min(12)->mixedCase()->numbers()->symbols()],
            ]);
            if ($v->fails()) {
                $this->error(implode(' ', $v->errors()->all()));
                return self::FAILURE;
            }
        }

        $result = DB::transaction(function () use ($email, $password, $existingUser) {
            $ownerExists = User::where('is_platform_admin', true)
                ->where('platform_role', 'platform_owner')
                ->lockForUpdate()
                ->exists();

            if ($ownerExists && !$this->option('additional')) {
                return 'exists';
            }

            $user = $existingUser ?: new User();
            if (!$existingUser) {
                $user->forceFill([
                    'name'              => $this->option('name') ?: explode('@', $email)[0],
                    'email'             => $email,
                    'password'          => Hash::make($password),
                    'email_verified_at' => now(),
                ]);
            }
            $user->forceFill([
                'is_platform_admin' => true,
                'platform_role'     => 'platform_owner',
            ])->save();

            return $existingUser ? 'promoted' : 'created';
        });

        if ($result === 'exists') {
            $this->error('A platform owner already exists. Re-run with --additional to add another.');
            return self::FAILURE;
        }

        $this->info($result === 'created'
            ? "Platform owner {$email} created. Sign in at /VenQore-login and enrol 2FA."
            : "Existing user {$email} promoted to platform owner. They must enrol 2FA at next sign-in.");

        return self::SUCCESS;
    }
}
