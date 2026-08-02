<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Inertia\Inertia;

class BlogController extends Controller
{
    /**
     * Format a BlogPost model for Inertia frontend consumption.
     */
    private function formatPost(BlogPost $post): array
    {
        return [
            'id' => $post->id,
            'uid' => (string) $post->id,
            'slug' => $post->slug,
            'title' => $post->title,
            'excerpt' => $post->excerpt,
            'content' => $post->content,
            'category' => $post->category,
            'author' => $post->author,
            'date' => optional($post->published_at ?? $post->created_at)->format('Y-m-d'),
            'image' => $post->image ?: '/images/blog/hero_banner.jpg',
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
        ];
    }

    public function index()
    {
        $posts = BlogPost::published()
            ->get()
            ->map(fn (BlogPost $post) => $this->formatPost($post))
            ->values()
            ->all();

        return Inertia::render('Marketing/Blog/Index', [
            'posts' => $posts
        ]);
    }

    public function show($slug)
    {
        $postModel = BlogPost::published()
            ->where('slug', $slug)
            ->first();

        if (!$postModel) {
            abort(404);
        }

        $post = $this->formatPost($postModel);

        $recentPosts = BlogPost::published()
            ->where('id', '!=', $postModel->id)
            ->take(3)
            ->get()
            ->map(fn (BlogPost $p) => $this->formatPost($p))
            ->values()
            ->all();

        return Inertia::render('Marketing/Blog/Show', [
            'post' => $post,
            'recentPosts' => $recentPosts
        ]);
    }

    /**
     * Get all published blog posts as array.
     */
    public function getPosts(): array
    {
        return BlogPost::published()
            ->get()
            ->map(fn (BlogPost $post) => $this->formatPost($post))
            ->values()
            ->all();
    }
}
