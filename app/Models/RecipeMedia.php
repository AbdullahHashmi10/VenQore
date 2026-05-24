<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\HasTenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RecipeMedia extends Model
{
    use HasUuids, HasTenant;
    protected $guarded = [];

    protected $casts = [
        'step_number' => 'integer',
        'sort_order' => 'integer',
    ];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    /**
     * Get embed URL for videos
     */
    public function getEmbedUrlAttribute()
    {
        if ($this->type === 'youtube') {
            // Convert youtube.com/watch?v=xxx to embed URL
            preg_match('/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/', $this->url, $matches);
            if (isset($matches[1])) {
                return "https://www.youtube.com/embed/{$matches[1]}";
            }
        }
        return $this->url;
    }
}
