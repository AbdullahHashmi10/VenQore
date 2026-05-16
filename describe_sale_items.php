<?php
foreach(DB::select('DESCRIBE sale_items') as $c) {
    echo $c->Field . ' (' . $c->Type . ")\n";
}
