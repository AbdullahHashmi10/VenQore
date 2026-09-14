<?php

namespace App\Services;

class SimpleMarkdownParser
{
    /**
     * Converts a raw markdown string into safe, styled HTML markup.
     */
    public static function parse(string $markdown): string
    {
        // 1. Normalize line endings and HTML entities safely (but allow basic elements we generate)
        $html = htmlspecialchars($markdown, ENT_NOQUOTES, 'UTF-8');

        // 2. Parse Code blocks: ```language ... ```
        $html = preg_replace_callback('/```(\w*)\n([\s\S]*?)```/', function($matches) {
            $lang = $matches[1] ?: 'text';
            $code = trim($matches[2]);
            return "<pre><code class=\"language-{$lang} block p-4 rounded-xl bg-slate-900/[0.03] dark:bg-black/40 border border-slate-900/10 dark:border-white/5 text-slate-800 dark:text-slate-300 text-xs overflow-x-auto my-6\">{$code}</code></pre>";
        }, $html);

        // 3. Parse Tables
        $html = preg_replace_callback('/(?:^\|[^\n]+\|\r?\n){2,}/m', function($matches) {
            $tableBlock = trim($matches[0]);
            $lines = array_filter(explode("\n", $tableBlock));
            if (count($lines) < 2) return $matches[0];
            
            $tableHtml = "<div class=\"overflow-x-auto my-6 rounded-xl border border-slate-900/10 dark:border-white/5 bg-slate-900/[0.01] dark:bg-white/[0.01]\"><table class=\"w-full text-left text-xs border-collapse\">\n";
            
            // Header row
            $headers = array_map('trim', explode('|', trim(array_shift($lines), '|')));
            $tableHtml .= "<thead>\n<tr class=\"border-b border-slate-900/10 dark:border-white/10 bg-slate-900/[0.02] dark:bg-white/[0.02]\">\n";
            foreach ($headers as $h) {
                $tableHtml .= "<th class=\"py-3.5 px-4 font-bold text-slate-800 dark:text-slate-300\">{$h}</th>\n";
            }
            $tableHtml .= "</tr>\n</thead>\n<tbody class=\"divide-y divide-slate-900/[0.04] dark:divide-white/[0.04]\">\n";
            
            // Skip separator row (starts with |--- or similar)
            array_shift($lines);
            
            // Data rows
            foreach ($lines as $line) {
                $cols = array_map('trim', explode('|', trim($line, '|')));
                $tableHtml .= "<tr>\n";
                foreach ($cols as $c) {
                    $tableHtml .= "<td class=\"py-3.5 px-4 text-slate-600 dark:text-slate-400\">{$c}</td>\n";
                }
                $tableHtml .= "</tr>\n";
            }
            
            $tableHtml .= "</tbody>\n</table></div>";
            return $tableHtml;
        }, $html);

        // 4. Parse Blockquotes
        $html = preg_replace('/^\s*&gt;\s+(.+)$/m', '<blockquote class="border-l-2 border-indigo-500/40 pl-6 py-2 text-sm text-indigo-800 dark:text-indigo-200/80 italic my-6 font-medium bg-indigo-500/[0.02] rounded-r-lg">$1</blockquote>', $html);

        // 5. Parse Headings (###, ##, #)
        $html = preg_replace('/^\s*###\s+(.+)$/m', '<h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-8 mb-3 font-display">$1</h3>', $html);
        $html = preg_replace('/^\s*##\s+(.+)$/m', '<h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-10 mb-4 font-display pb-2 border-b border-slate-900/10 dark:border-white/[0.05]">$1</h2>', $html);
        $html = preg_replace('/^\s*#\s+(.+)$/m', '<h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-12 mb-6 font-display">$1</h1>', $html);

        // 6. Parse Lists (ul/ol)
        // Bullet list items
        $html = preg_replace('/^\s*[-*+]\s+(.+)$/m', '<li class="text-slate-600 dark:text-slate-400 leading-relaxed py-1 flex items-start gap-2"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500/50 mt-2 flex-shrink-0"></span><span>$1</span></li>', $html);

        // 7. Parse Inline Elements
        // Inline code: `code`
        $html = preg_replace('/`([^`]+)`/', '<code class="px-1.5 py-0.5 rounded bg-slate-900/[0.04] dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-indigo-600 dark:text-indigo-300 font-mono text-[13px]">$1</code>', $html);

        // Bold: **text**
        $html = preg_replace('/\*\*([^*]+)\*\*/', '<strong class="text-slate-900 dark:text-white font-semibold">$1</strong>', $html);

        // Italic: *text*
        $html = preg_replace('/\*([^*]+)\*/', '<em class="text-slate-700 dark:text-slate-200 italic">$1</em>', $html);

        // Links: [text](url)
        $html = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '<a href="$2" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 underline transition-colors">$1</a>', $html);

        // 8. Wrap standalone text in paragraphs
        $paragraphs = explode("\n\n", $html);
        foreach ($paragraphs as &$p) {
            $p = trim($p);
            if ($p === '') continue;
            // Only wrap if it doesn't already start with a block-level HTML tag we support
            if (!preg_match('/^(<h|<pre|<blockquote|<li|<ul|<ol|<div|<table)/i', $p)) {
                $p = "<p class=\"text-slate-600 dark:text-slate-400 leading-[1.8] text-sm my-4\">{$p}</p>";
            }
        }
        $html = implode("\n\n", $paragraphs);

        // Clean up empty lines or duplicate blocks
        return trim($html);
    }
}
