<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vena_knowledge_base', function (Blueprint $table) {
            $table->id();
            $table->string('session_uuid', 64)->nullable()->index();
            $table->text('question');
            $table->text('vena_suggestion')->nullable();
            $table->text('agent_answer');
            $table->boolean('was_edited')->default(false);
            $table->text('edit_delta')->nullable();
            $table->string('category', 50)->nullable()->index();
            $table->integer('times_seen')->default(1);
            $table->boolean('ai_autonomous')->default(false)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vena_knowledge_base');
    }
};
