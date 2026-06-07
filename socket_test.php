<?php
$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if ($socket === false) {
    echo "socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n";
} else {
    echo "Socket created.\n";
    if (socket_bind($socket, '127.0.0.1', 8000) === false) {
        echo "socket_bind() failed: reason: " . socket_strerror(socket_last_error($socket)) . "\n";
    } else {
        echo "Socket bound to 127.0.0.1:8000.\n";
    }
    socket_close($socket);
}
?>