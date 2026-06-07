<?php
$log = file_get_contents('d:/AMD POS/storage/logs/laravel.log');
$lines = explode("\n", $log);
$recent = array_slice($lines, -200);
echo implode("\n", $recent);
