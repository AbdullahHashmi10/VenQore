<?php
echo "Starting connection test...\n";

echo "Trying localhost...\n";
try {
    $conn1 = new PDO('mysql:host=localhost;port=3306;dbname=amd_pos', 'root', '', [
        PDO::ATTR_TIMEOUT => 3,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "Localhost Succeeded!\n";
} catch(Exception $e) {
    echo "Localhost Failed: " . $e->getMessage() . "\n";
}

echo "Trying 127.0.0.1...\n";
try {
    $conn2 = new PDO('mysql:host=127.0.0.1;port=3306;dbname=amd_pos', 'root', '', [
        PDO::ATTR_TIMEOUT => 3,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "127.0.0.1 Succeeded!\n";
} catch(Exception $e) {
    echo "127.0.0.1 Failed: " . $e->getMessage() . "\n";
}
echo "Test Finished!\n";
