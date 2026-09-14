<?php

namespace App\Services;

class TwoFactorService
{
    /**
     * Generate a random 16-character Base32 secret key.
     */
    public function generateSecret(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 16; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }
        return $secret;
    }

    /**
     * Get the OTP Auth URL for QR code generation.
     */
    public function getQRCodeUrl(string $secret, string $email): string
    {
        $issuer = rawurlencode('VenQore POS');
        $account = rawurlencode($email);
        return "otpauth://totp/{$issuer}:{$account}?secret={$secret}&issuer={$issuer}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Verify a 6-digit TOTP code against a Base32 secret key.
     */
    public function verifyCode(string $secret, string $code, int $window = 1): bool
    {
        if (strlen($code) !== 6 || !is_numeric($code)) {
            return false;
        }

        $secretBytes = $this->base32Decode($secret);
        if ($secretBytes === null) {
            return false;
        }

        $time = floor(time() / 30);

        for ($i = -$window; $i <= $window; $i++) {
            $step = $time + $i;
            $packTime = pack('N*', 0) . pack('N*', $step);
            $hash = hash_hmac('sha1', $packTime, $secretBytes, true);
            
            $offset = ord($hash[19]) & 0xf;
            $otp = (
                ((ord($hash[$offset + 0]) & 0x7f) << 24) |
                ((ord($hash[$offset + 1]) & 0xff) << 16) |
                ((ord($hash[$offset + 2]) & 0xff) << 8) |
                (ord($hash[$offset + 3]) & 0xff)
            ) % 1000000;

            if (str_pad((string)$otp, 6, '0', STR_PAD_LEFT) === $code) {
                return true;
            }
        }

        return false;
    }

    /**
     * Decode a Base32 encoded string.
     */
    private function base32Decode(string $base32): ?string
    {
        $base32 = strtoupper($base32);
        if (!preg_match('/^[A-Z2-7=]+$/', $base32)) {
            return null;
        }

        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $map = array_flip(str_split($chars));

        $base32 = str_replace('=', '', $base32);
        $len = strlen($base32);
        $binary = '';

        for ($i = 0; $i < $len; $i++) {
            if (!isset($map[$base32[$i]])) {
                return null;
            }
            $binary .= str_pad(decbin($map[$base32[$i]]), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($binary, 8) as $bin) {
            if (strlen($bin) === 8) {
                $bytes .= chr(bindec($bin));
            }
        }

        return $bytes;
    }
}
