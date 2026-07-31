---
tags: [models, ai, support, chat]
---

# Models — AI, Chat & Support

Part of [[VenQore POS - Home]]

## AiRecommendation
AI-generated sales/inventory suggestions. Scopes: `scopeActive` (not dismissed + not expired), `scopeUnread`. Explicit `tenant_id` requirement noted (WOUND 3 FIX).

## ChatSession / ChatMessage / ChatLearningLog / VenaKnowledgeBase — Vena AI chat support
`ChatSession`: status constants (`bot_active, human_requested, agent_claimed, agent_active, idle_offline, resolved`). Helper methods `isResolved()`, `isBotActive()`.
`ChatMessage`: sender type constants (visitor/bot/agent/system).
`ChatLearningLog`: records where AI suggestion was edited by a human agent (`problem, solution, category`).
`VenaKnowledgeBase`: AI Q&A cache with `times_seen` counter, `was_edited`/`ai_autonomous` flags.

## SupportTicket / SupportTicketReply
Helpdesk tickets, originate from `vena_chat` or manual. Methods `isOpen()`, `isResolved()`, static `openCount()`.

## CannedResponse
Support agent quick-reply templates.

## PkVerification
Pakistan-specific identity/KYC verification (CNIC hash, front/back images, review workflow).

## Related
- [[Platform Infrastructure Services]] (ChatAIService, ChatRoutingService, KnowledgeLearningService)
