<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class IndexNowService
{
    protected string $key = '83f4b04e475f44d4bfa04f7abac5aa3b';
    protected string $keyLocation = 'https://venqore.com/83f4b04e475f44d4bfa04f7abac5aa3b.txt';
    protected string $host = 'venqore.com';

    /**
     * Submit a URL or list of URLs to the IndexNow API.
     *
     * @param array|string $urls Absolute URL string or array of URLs.
     * @return bool
     */
    public function submit(array|string $urls): bool
    {
        // Don't send real HTTP requests during testing to avoid slow execution/timeouts
        if (app()->environment('testing')) {
            Log::info('IndexNow submission mocked in testing environment', ['urls' => $urls]);
            return true;
        }

        $urlList = is_array($urls) ? $urls : [$urls];

        // Clean and normalize URLs to match the host domain
        $urlList = array_map(function ($url) {
            $parsed = parse_url($url);
            $path = $parsed['path'] ?? '';
            $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
            return "https://{$this->host}" . $path . $query;
        }, $urlList);

        try {
            $response = Http::post('https://api.indexnow.org/IndexNow', [
                'host' => $this->host,
                'key' => $this->key,
                'keyLocation' => $this->keyLocation,
                'urlList' => $urlList,
            ]);

            if ($response->successful()) {
                Log::info('IndexNow submission successful', ['urls' => $urlList]);
                return true;
            }

            Log::warning('IndexNow submission failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'urls' => $urlList
            ]);
        } catch (\Throwable $e) {
            Log::error('IndexNow submission exception', [
                'message' => $e->getMessage(),
                'urls' => $urlList
            ]);
        }

        return false;
    }
}
