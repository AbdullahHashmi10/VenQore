<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Support\MarketingSeo;
use Illuminate\Support\Facades\Route;

class DocumentationHubTest extends TestCase
{
    /** @test */
    public function docs_routes_are_registered_and_accessible()
    {
        $this->assertTrue(Route::has('marketing.docs.index'));
        $this->assertTrue(Route::has('marketing.docs.show'));
    }

    /** @test */
    public function docs_index_loads_getting_started_by_default()
    {
        $response = $this->get('/docs');
        $response->assertStatus(200);

        // Verify Inertia rendering page component name
        $response->assertInertia(fn ($page) => $page
            ->component('Marketing/Docs/Show', false)
            ->has('navigation')
            ->where('currentDoc.slug', 'getting-started')
        );
    }

    /** @test */
    public function docs_show_loads_specific_markdown_document()
    {
        $response = $this->get('/docs/store-setup');
        $response->assertStatus(200);

        // Verify that the route dynamically enables Inertia SSR
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            "Expected Inertia SSR to be enabled for /docs/store-setup"
        );

        $response->assertInertia(fn ($page) => $page
            ->component('Marketing/Docs/Show', false)
            ->where('currentDoc.slug', 'store-setup')
            ->has('currentDoc.body_html')
            ->has('currentDoc.qas')
        );

        // Verify the HTML response contains title & headings
        $response->assertSee('Store Setup');
        
        // Verify JSON-LD FAQPage exists in raw HTML
        $html = $response->getContent();
        $this->assertStringContainsString('"@type":"FAQPage"', $html);
        $this->assertStringContainsString('How do I add and manage multiple warehouses', $html);
    }

    /** @test */
    public function docs_search_filters_qas_correctly()
    {
        $response = $this->get('/docs?search=offline');
        $response->assertStatus(200);

        // Assert search results contain offline matching Q&As
        $response->assertInertia(fn ($page) => $page
            ->component('Marketing/Docs/Show', false)
            ->where('searchQuery', 'offline')
            ->has('searchResults')
        );

        $data = $response->original->getData();
        $searchResults = $data['page']['props']['searchResults'] ?? [];
        
        $this->assertNotEmpty($searchResults, "Expected search results for 'offline' to not be empty.");
        
        $found = false;
        foreach ($searchResults as $result) {
            if (str_contains(strtolower($result['question']), 'offline') || 
                str_contains(strtolower($result['answer']), 'offline')) {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, "Expected at least one search result to contain 'offline'.");
    }

    /** @test */
    public function invalid_doc_slug_aborts_with_404()
    {
        $response = $this->get('/docs/non-existent-document-slug');
        $response->assertStatus(404);
    }
}
