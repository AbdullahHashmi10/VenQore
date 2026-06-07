<?php

namespace App\Services;

use App\Models\VenaKnowledgeBase;
use Illuminate\Support\Facades\Log;

class KnowledgeLearningService
{
    private ChatAIService $aiService;

    public function __construct(ChatAIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Passive background learning pipeline on every agent message reply.
     */
    public function learn(string $sessionUuid, string $question, ?string $venaSuggestion, string $agentAnswer): void
    {
        if (empty($question) || empty($agentAnswer)) {
            return;
        }

        try {
            // 1. Compute was_edited & edit_delta
            $wasEdited = true;
            $editDelta = null;

            if ($venaSuggestion === null || trim($venaSuggestion) === '') {
                $wasEdited = true;
                $editDelta = "No AI suggestion was generated.";
            } else {
                $trimmedSuggestion = trim($venaSuggestion);
                $trimmedAnswer = trim($agentAnswer);
                if ($trimmedSuggestion === $trimmedAnswer) {
                    $wasEdited = false;
                } else {
                    $wasEdited = true;
                    // Simple text delta
                    $editDelta = "AI Drafted: \"{$trimmedSuggestion}\"\nAgent Wrote: \"{$trimmedAnswer}\"";
                }
            }

            // 2. Auto-categorize via Gemini API
            $category = $this->aiService->classifyCategory($question);

            // 3. Deduplicate / Incremental Matching Check
            // Fetch last 100 entries to check for highly similar questions
            $similarEntry = null;
            $existingEntries = VenaKnowledgeBase::where('category', $category)->orderBy('id', 'desc')->limit(100)->get();

            foreach ($existingEntries as $entry) {
                // Standard PHP similar_text check (highly robust for deduplicating similar queries)
                similar_text(strtolower(trim($question)), strtolower(trim($entry->question)), $percent);
                if ($percent >= 85.0) {
                    $similarEntry = $entry;
                    break;
                }
            }

            if ($similarEntry) {
                // Increment times seen and update answers if they got edited
                $similarEntry->increment('times_seen');
                if ($wasEdited) {
                    // Update agent answer to keep the knowledge base up-to-date with latest verified solutions
                    $similarEntry->update([
                        'agent_answer' => $agentAnswer,
                        'was_edited' => true,
                        'edit_delta' => $editDelta,
                    ]);
                }
            } else {
                // Create new verified KB entry
                VenaKnowledgeBase::create([
                    'session_uuid' => $sessionUuid,
                    'question' => $question,
                    'vena_suggestion' => $venaSuggestion,
                    'agent_answer' => $agentAnswer,
                    'was_edited' => $wasEdited,
                    'edit_delta' => $editDelta,
                    'category' => $category,
                    'times_seen' => 1,
                    'ai_autonomous' => false,
                ]);
            }
        } catch (\Exception $e) {
            Log::error("KnowledgeLearningService passive loop failed: " . $e->getMessage());
        }
    }
}
