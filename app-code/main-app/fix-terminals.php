<?php
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::create('terminals', function (Blueprint $t) {
    $t->id();
    $t->boolean('is_active')->default(true);
});
