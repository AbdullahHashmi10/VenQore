<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

echo "Attempting to connect to MySQL at $host...\n";

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected successfully.\n";
    echo "Creating database 'venqore_pos' if it doesn't exist...\n";
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS venqore_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    echo "Database 'venqore_pos' created (or already existed).\n";
    
} catch (PDOException $e) {
    echo "ERROR: Could not connect or create database.\n";
    echo "Message: " . $e->getMessage() . "\n";
    exit(1);
}
