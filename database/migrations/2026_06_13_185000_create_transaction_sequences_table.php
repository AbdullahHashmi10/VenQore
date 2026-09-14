<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('transaction_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->string('prefix', 10);
            $table->string('register_id', 20)->default('R1');
            $table->string('date', 10); // Format: DDMMYY
            $table->integer('last_sequence')->default(0);
            $table->timestamps();

            // Composite unique index to prevent duplicates
            $table->unique(['tenant_id', 'prefix', 'register_id', 'date'], 'txn_seq_unique');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('transaction_sequences');
    }
};
