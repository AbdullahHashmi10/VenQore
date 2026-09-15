<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * BlogPostEngineTest — RECONSTRUCTED 2026-08-02.
 *
 * Original deleted during Batch 1/2 cleanup, never committed to git. The six
 * method names were recovered from the run ledger and reimplemented against
 * BlogController, BlogPost and SuperAdmin\BlogPostAdminController.
 *
 * Writes rows, so RefreshDatabase is required.
 *
 * ⚠️ ONE ASSERTION COULD NOT BE FULLY RECONSTRUCTED — see
 * blog_show_page_includes_blogposting_json_ld_schema below. The original
 * asserted BlogPosting JSON-LD is present, but no JSON-LD emitter exists in
 * BlogController or the Blog page components today. Either the feature was
 * removed, or it lives somewhere this reconstruction did not find. That test
 * is therefore written to FAIL LOUDLY with an explanation rather than silently
 * assert nothing. Read it before you "fix" it.
 */
class BlogPostEngineTest extends TestCase
{
    use RefreshDatabase;

    private function publishedPost(array $overrides = []): BlogPost
    {
        return BlogPost::create(array_merge([
            'slug'             => 'venqore-launches-offline-pos',
            'title'            => 'VenQore Launches Offline POS',
            'excerpt'          => 'Sell even when the internet drops.',
            'content'          => 'Full article body about offline selling.',
            'category'         => 'Product',
            'author'           => 'VenQore Team',
            'meta_title'       => 'VenQore Launches Offline POS',
            'meta_description' => 'Sell even when the internet drops.',
            'is_published'     => true,
            'published_at'     => now()->subDay(),
        ], $overrides));
    }

    /** @test */
    public function blog_index_page_renders_successfully_with_ssr()
    {
        $this->publishedPost();

        config(['inertia.ssr.enabled' => false]);

        $response = $this->get('/blog');

        $response->assertStatus(200);
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            'Expected Inertia SSR to be enabled for /blog'
        );
        $response->assertInertia(fn ($page) => $page->component('Marketing/Blog/Index'));
    }

    /** @test */
    public function blog_show_page_renders_successfully_with_dynamic_seo_and_ssr()
    {
        $post = $this->publishedPost();

        config(['inertia.ssr.enabled' => false]);

        $response = $this->get("/blog/{$post->slug}");

        $response->assertStatus(200);
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            "Expected Inertia SSR to be enabled for /blog/{$post->slug}"
        );

        // Dynamic SEO: the post's own meta must reach the page, not a static default.
        $response->assertSee($post->meta_title, false);
    }

    /** @test */
    public function unknown_blog_slug_returns_404()
    {
        $this->get('/blog/no-such-article')->assertStatus(404);
    }

    /** @test */
    public function unpublished_posts_are_not_publicly_reachable()
    {
        // ADDED during reconstruction. BlogPost::published() gates on
        // is_published AND published_at; nothing asserted that gate held, and a
        // leak would publish drafts to the world.
        $draft = $this->publishedPost([
            'slug'         => 'unfinished-draft',
            'is_published' => false,
        ]);

        $this->get("/blog/{$draft->slug}")->assertStatus(404);

        $future = $this->publishedPost([
            'slug'         => 'scheduled-for-later',
            'published_at' => now()->addWeek(),
        ]);

        $this->get("/blog/{$future->slug}")->assertStatus(404);
    }

    /** @test */
    public function sitemap_xml_dynamically_includes_blog_posts_from_database()
    {
        $post = $this->publishedPost(['slug' => 'indexed-article']);

        $response = $this->get('/sitemap-blog.xml');

        $response->assertStatus(200);
        $response->assertSee("/blog/{$post->slug}", false);
    }

    /** @test */
    public function superadmin_can_create_update_and_delete_blog_posts()
    {
        $admin = User::factory()->create(['is_platform_admin' => true]);

        $this->actingAs($admin);

        // CREATE
        $this->post(route('platform.blog-posts.store'), [
            'slug'         => 'admin-created-post',
            'title'        => 'Admin Created Post',
            'excerpt'      => 'Created through the platform panel.',
            'content'      => 'Body text.',
            'category'     => 'Announcements',
            'author'       => 'Platform Admin',
            'is_published' => true,
            'published_at' => now()->subHour(),
        ])->assertRedirect();

        $this->assertDatabaseHas('blog_posts', ['slug' => 'admin-created-post']);

        $post = BlogPost::where('slug', 'admin-created-post')->firstOrFail();

        // UPDATE
        $this->put(route('platform.blog-posts.update', $post->id), [
            'slug'         => 'admin-created-post',
            'title'        => 'Admin Updated Post',
            'excerpt'      => 'Updated excerpt.',
            'content'      => 'Updated body.',
            'category'     => 'Announcements',
            'author'       => 'Platform Admin',
            'is_published' => true,
            'published_at' => now()->subHour(),
        ])->assertRedirect();

        $this->assertDatabaseHas('blog_posts', [
            'id'    => $post->id,
            'title' => 'Admin Updated Post',
        ]);

        // DELETE
        $this->delete(route('platform.blog-posts.destroy', $post->id))->assertRedirect();

        $this->assertDatabaseMissing('blog_posts', ['id' => $post->id]);
    }

    /**
     * ⚠️ RECONSTRUCTION GAP — READ BEFORE CHANGING.
     *
     * The run ledger proves a test of this name existed and was passing, so at
     * some point /blog/{slug} emitted BlogPosting JSON-LD for Google rich
     * results. No JSON-LD emitter can be found today in BlogController,
     * formatPost(), or resources/js/Pages/Marketing/Blog/*.
     *
     * Two possibilities, and only a human can say which:
     *   (a) The feature was removed or regressed  -> fix the CODE, keep this test.
     *   (b) JSON-LD moved somewhere this search missed -> point this test at it.
     *
     * It is deliberately written to fail with this explanation rather than be
     * silently deleted or weakened into a no-op.
     *
     * @test
     */
    public function blog_show_page_includes_blogposting_json_ld_schema()
    {
        $post = $this->publishedPost();

        $response = $this->get("/blog/{$post->slug}");
        $response->assertStatus(200);

        $html = $response->getContent();

        $this->assertStringContainsString(
            'BlogPosting',
            $html,
            "BlogPosting JSON-LD is missing from /blog/{$post->slug}.\n\n"
            . "This test was reconstructed from the run ledger, which shows it "
            . "existed and passed previously — so this schema was being emitted "
            . "at some point and no longer is.\n\n"
            . "Without it, blog posts lose Google rich-result eligibility.\n\n"
            . "If JSON-LD was intentionally dropped, delete this test and record "
            . "the decision. Do NOT weaken it to assert nothing."
        );
    }
}
