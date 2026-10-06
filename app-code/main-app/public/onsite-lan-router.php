<?php

// Restricted development LAN gateway for the onsite catalogue. The main POS
// remains bound to localhost; this listener exposes only catalogue traffic and
// the static assets required to render it on customer phones.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

$catalogueRequest = preg_match('#^/catalogue/[a-z0-9-]+(?:/table/[A-Za-z0-9]{40}|/orders)?$#', $path) === 1;
$staticRequest = preg_match('#^/(?:build|storage|images|fonts)/#', $path) === 1
    || in_array($path, ['/favicon.ico', '/favicon.svg', '/robots.txt'], true);

if (! $catalogueRequest && ! $staticRequest) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'This local address serves only the onsite catalogue.';
    exit;
}

if ($catalogueRequest && ! in_array($method, ['GET', 'HEAD', 'POST'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD, POST');
    exit;
}

$file = __DIR__ . $path;
if ($staticRequest && is_file($file)) return false;

require __DIR__ . '/index.php';
