<?php try { new PDO('mysql:host=127.0.0.1;port=3306;dbname=amd_pos', 'root', ''); echo 'Connected'; } catch (Exception $e) { echo $e->getMessage(); }
