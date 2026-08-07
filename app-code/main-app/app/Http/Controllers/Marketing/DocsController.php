<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Services\SimpleMarkdownParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class DocsController extends Controller
{
    /**
     * Parse frontmatter and body from a markdown file path.
     */
    private function parseDocFile(string $path, string $slug): array
    {
        $content = File::get($path);
        
        $title = ucfirst(str_replace('-', ' ', $slug));
        $description = '';
        $category = 'General';
        $order = 99;
        $body = $content;

        if (str_starts_with($content, '---')) {
            $parts = explode('---', $content, 3);
            if (count($parts) >= 3) {
                $frontmatter = $parts[1];
                $body = $parts[2];

                foreach (explode("\n", $frontmatter) as $line) {
                    $line = trim($line);
                    if (str_contains($line, ':')) {
                        [$key, $val] = explode(':', $line, 2);
                        $key = trim($key);
                        $val = trim($val, " \t\n\r\0\x0B\"'");
                        if ($key === 'title') $title = $val;
                        elseif ($key === 'description') $description = $val;
                        elseif ($key === 'category') $category = $val;
                        elseif ($key === 'order') $order = (int) $val;
                    }
                }
            }
        }

        $bodyMarkdown = trim($body);
        
        // Extract Question & Answer pairs from the markdown body
        // Format expected: ### Q: [Question] \n **A:** [Answer]
        $qas = [];
        preg_match_all('/### Q:\s*(.+?)\r?\n\*\*A:\*\*\s*(.+?)(?=\r?\n### Q:|\z)/s', $bodyMarkdown, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $qas[] = [
                'question' => trim($match[1]),
                'answer' => trim($match[2]),
                'category' => $category,
                'slug' => $slug,
            ];
        }

        return [
            'slug' => $slug,
            'title' => $title,
            'description' => $description,
            'category' => $category,
            'order' => $order,
            'body_markdown' => $bodyMarkdown,
            'body_html' => SimpleMarkdownParser::parse($bodyMarkdown),
            'qas' => $qas,
        ];
    }

    /**
     * Get all documents metadata & list of QAs.
     */
    private function getAllDocs(): array
    {
        $docsDir = resource_path('docs');
        if (!File::exists($docsDir)) {
            return [];
        }

        $files = File::files($docsDir);
        $allDocs = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'md') {
                $slug = $file->getBasename('.md');
                $allDocs[] = $this->parseDocFile($file->getPathname(), $slug);
            }
        }

        // Sort by order ASC, title ASC
        usort($allDocs, function ($a, $b) {
            if ($a['order'] === $b['order']) {
                return strcmp($a['title'], $b['title']);
            }
            return $a['order'] <=> $b['order'];
        });

        return $allDocs;
    }

    public function index(Request $request)
    {
        return $this->show($request, 'getting-started');
    }

    public function show(Request $request, $slug)
    {
        $allDocs = $this->getAllDocs();
        
        // Find current document
        $currentDoc = null;
        foreach ($allDocs as $doc) {
            if ($doc['slug'] === $slug) {
                $currentDoc = $doc;
                break;
            }
        }

        if (!$currentDoc) {
            abort(404);
        }

        // Build Sidebar Navigation Tree grouped by Category
        $navigation = [];
        foreach ($allDocs as $doc) {
            $cat = $doc['category'];
            if (!isset($navigation[$cat])) {
                $navigation[$cat] = [];
            }
            $navigation[$cat][] = [
                'title' => $doc['title'],
                'slug' => $doc['slug'],
                'active' => $doc['slug'] === $slug,
            ];
        }

        // Handle Q&A search query
        $searchQuery = $request->input('search');
        $searchResults = [];
        if (!empty($searchQuery)) {
            $query = strtolower($searchQuery);
            foreach ($allDocs as $doc) {
                foreach ($doc['qas'] as $qa) {
                    if (str_contains(strtolower($qa['question']), $query) || 
                        str_contains(strtolower($qa['answer']), $query)) {
                        $searchResults[] = $qa;
                    }
                }
            }
        }

        return Inertia::render('Marketing/Docs/Show', [
            'navigation' => $navigation,
            'currentDoc' => [
                'slug' => $currentDoc['slug'],
                'title' => $currentDoc['title'],
                'description' => $currentDoc['description'],
                'body_html' => $currentDoc['body_html'],
                'qas' => $currentDoc['qas'],
            ],
            'searchQuery' => $searchQuery,
            'searchResults' => $searchResults,
        ]);
    }
}
