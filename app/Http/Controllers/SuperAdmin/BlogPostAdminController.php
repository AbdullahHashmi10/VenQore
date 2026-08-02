<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BlogPostAdminController extends Controller
{
    public function index()
    {
        $posts = BlogPost::orderByDesc('id')->get();

        return Inertia::render('Platform/BlogPosts/Index', [
            'posts' => $posts
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:blog_posts,slug',
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'category' => 'required|string|max:100',
            'author' => 'nullable|string|max:100',
            'image' => 'nullable|string|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        if (empty($validated['author'])) {
            $validated['author'] = 'VenQore Editorial';
        }

        if (isset($validated['is_published']) && $validated['is_published'] && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $post = BlogPost::create($validated);

        if ($post->is_published) {
            try {
                app(\App\Services\IndexNowService::class)->submit(route('blog.show', ['slug' => $post->slug]));
            } catch (\Throwable $e) {
                // Prevent interruption of admin flow
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'post' => $post,
            ]);
        }

        return redirect()->back()->with('success', 'Blog post created successfully.');
    }

    public function update(Request $request, BlogPost $blogPost)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:blog_posts,slug,' . $blogPost->id,
            'excerpt' => 'nullable|string',
            'content' => 'required|string',
            'category' => 'required|string|max:100',
            'author' => 'nullable|string|max:100',
            'image' => 'nullable|string|max:255',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
        ]);

        if (isset($validated['is_published']) && $validated['is_published'] && empty($blogPost->published_at) && empty($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $blogPost->update($validated);

        if ($blogPost->is_published) {
            try {
                app(\App\Services\IndexNowService::class)->submit(route('blog.show', ['slug' => $blogPost->slug]));
            } catch (\Throwable $e) {
                // Prevent interruption of admin flow
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'post' => $blogPost->fresh(),
            ]);
        }

        return redirect()->back()->with('success', 'Blog post updated successfully.');
    }

    public function destroy(Request $request, BlogPost $blogPost)
    {
        $blogPost->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Blog post deleted successfully.',
            ]);
        }

        return redirect()->back()->with('success', 'Blog post deleted successfully.');
    }
}
