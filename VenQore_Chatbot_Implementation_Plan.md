# VenQore Hybrid Chatbot — Full Implementation Plan
### Human-in-the-Loop (HITL) Support System for Laravel 12 + React SPA

> **Stack:** Laravel 12 · Inertia.js v2 · React 18 · FilamentPHP v3 · Laravel Reverb · Laravel Horizon · Dexie.js · MySQL

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema Design](#2-database-schema-design)
3. [Phase 1 — Foundation & Real-Time Engine](#3-phase-1--foundation--real-time-engine)
4. [Phase 2 — AI Bot Layer](#4-phase-2--ai-bot-layer)
5. [Phase 3 — Handoff & Routing Logic](#5-phase-3--handoff--routing-logic)
6. [Phase 4 — Agent Command Center (Filament)](#6-phase-4--agent-command-center-filament)
7. [Phase 5 — Multi-Agent Conflict Prevention System](#7-phase-5--multi-agent-conflict-prevention-system)
8. [Phase 6 — Notifications & Escalation](#8-phase-6--notifications--escalation)
9. [Phase 7 — React Frontend Chat Widget](#9-phase-7--react-frontend-chat-widget)
10. [Phase 8 — Canned Responses & Productivity Tools](#10-phase-8--canned-responses--productivity-tools)
11. [Phase 9 — Offline & Resilience Layer](#11-phase-9--offline--resilience-layer)
12. [Phase 10 — Testing & QA Checklist](#12-phase-10--testing--qa-checklist)
13. [Risk Register & Mitigations](#13-risk-register--mitigations)
14. [Dependency Install Reference](#14-dependency-install-reference)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER (React SPA)                        │
│  Chat Widget (Dexie offline cache + WebSocket via Reverb)       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ WebSocket / HTTP
┌───────────────────────────▼─────────────────────────────────────┐
│                   LARAVEL 12 BACKEND                            │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │  ChatSession │  │  ChatMessage │  │   AgentSession      │    │
│  │  Controller  │  │  Controller  │  │   (Lock System)     │    │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘    │
│         │                │                     │               │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐    │
│  │              Routing & State Machine                    │    │
│  │   bot_active → human_requested → agent_claimed →        │    │
│  │   agent_active → resolved                               │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                             │                                   │
│  ┌──────────────┐  ┌────────▼──────────┐  ┌────────────────┐   │
│  │ Laravel Reverb│  │  Laravel Horizon  │  │  AI Service    │   │
│  │ (WebSocket)   │  │  (Job Queues)     │  │  (Claude API)  │   │
│  └──────────────┘  └───────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│              FILAMENT ADMIN — AGENT INBOX                       │
│   Multi-agent view · Session claiming · Typing push · Locks     │
└─────────────────────────────────────────────────────────────────┘
```

### Session State Machine

```
[NEW] ──► [bot_active] ──► [human_requested] ──► [agent_claimed] ──► [agent_active] ──► [resolved]
               │                                        ▲
               └── AI low confidence ───────────────────┘
               └── Handoff intent keyword ───────────────┘
               └── Idle timeout exceeded ────────────────┘
```

---

## 2. Database Schema Design

### 2.1 `chat_sessions`

```sql
CREATE TABLE chat_sessions (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id           BIGINT UNSIGNED NOT NULL,         -- multi-tenant isolation
    session_uuid        CHAR(36) NOT NULL UNIQUE,         -- public-facing token
    visitor_name        VARCHAR(100) NULL,
    visitor_email       VARCHAR(150) NULL,
    status              ENUM(
                            'bot_active',
                            'human_requested',
                            'agent_claimed',
                            'agent_active',
                            'idle_offline',
                            'resolved'
                        ) NOT NULL DEFAULT 'bot_active',
    claimed_by          BIGINT UNSIGNED NULL,              -- FK → users.id
    claimed_at          TIMESTAMP NULL,
    claim_lock_token    CHAR(36) NULL,                     -- optimistic lock UUID
    claim_lock_expires  TIMESTAMP NULL,                    -- lock TTL (30 seconds)
    escalation_reason   VARCHAR(255) NULL,
    ticket_created      BOOLEAN NOT NULL DEFAULT FALSE,
    ai_disabled         BOOLEAN NOT NULL DEFAULT FALSE,
    last_message_at     TIMESTAMP NULL,
    resolved_at         TIMESTAMP NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_claimed_by (claimed_by),
    INDEX idx_session_uuid (session_uuid)
);
```

### 2.2 `chat_messages`

```sql
CREATE TABLE chat_messages (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id      BIGINT UNSIGNED NOT NULL,
    sender_type     ENUM('visitor', 'bot', 'agent', 'system') NOT NULL,
    sender_id       BIGINT UNSIGNED NULL,                  -- NULL for bot/visitor
    sender_name     VARCHAR(100) NULL,
    body            TEXT NOT NULL,
    metadata        JSON NULL,                             -- confidence, intent, etc.
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_at    TIMESTAMP NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_created (session_id, created_at)
);
```

### 2.3 `agent_typing_events`

```sql
-- Ephemeral table; purged on a schedule every 10 seconds
CREATE TABLE agent_typing_events (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id  BIGINT UNSIGNED NOT NULL,
    agent_id    BIGINT UNSIGNED NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    UNIQUE KEY uq_agent_session (session_id, agent_id)
);
```

### 2.4 `canned_responses`

```sql
CREATE TABLE canned_responses (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tenant_id   BIGINT UNSIGNED NOT NULL,
    shortcode   VARCHAR(50) NOT NULL,          -- e.g. "refund", "pricing"
    title       VARCHAR(150) NOT NULL,
    body        TEXT NOT NULL,
    created_by  BIGINT UNSIGNED NULL,
    INDEX idx_tenant_shortcode (tenant_id, shortcode)
);
```

### 2.5 `chat_tickets`

```sql
CREATE TABLE chat_tickets (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id      BIGINT UNSIGNED NOT NULL,
    tenant_id       BIGINT UNSIGNED NOT NULL,
    visitor_email   VARCHAR(150) NULL,
    summary         TEXT NULL,
    status          ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Phase 1 — Foundation & Real-Time Engine

**Estimated effort: 2–3 days**

### 3.1 Install Laravel Reverb

```bash
php artisan install:broadcasting
# Select Reverb when prompted
composer require laravel/reverb
php artisan reverb:install
```

Add to `.env`:
```
BROADCAST_DRIVER=reverb
REVERB_APP_ID=venqore_chat
REVERB_APP_KEY=your_key_here
REVERB_APP_SECRET=your_secret_here
REVERB_HOST=0.0.0.0
REVERB_PORT=8080
REVERB_SCHEME=https
```

### 3.2 Define Broadcast Channels

In `routes/channels.php`:

```php
// Private channel per chat session — visitor access
Broadcast::channel('chat.{sessionUuid}', function ($user, $sessionUuid) {
    // Visitors are unauthenticated; use signed URL tokens instead
    return true; // Validated via signed middleware on subscribe
});

// Private channel for admin inbox — agents only
Broadcast::channel('agent.inbox.{tenantId}', function ($user, $tenantId) {
    return $user->tenant_id === (int) $tenantId && $user->hasRole('agent');
});

// Private channel per agent — personal notifications
Broadcast::channel('agent.{agentId}', function ($user, $agentId) {
    return (int) $user->id === (int) $agentId;
});
```

### 3.3 Core Broadcast Events

Create the following in `app/Events/Chat/`:

| Event Class | Broadcast To | Triggered When |
|---|---|---|
| `MessageSent` | `chat.{uuid}` | Any new message |
| `TypingStarted` | `chat.{uuid}` | Agent/bot begins typing |
| `TypingStopped` | `chat.{uuid}` | Typing ceases or times out |
| `SessionStatusChanged` | `chat.{uuid}` + `agent.inbox.{tid}` | State machine transitions |
| `AgentJoined` | `chat.{uuid}` | Agent claims session |
| `AgentInboxUpdated` | `agent.inbox.{tid}` | New session, priority change |
| `SessionResolved` | `chat.{uuid}` + `agent.inbox.{tid}` | Session closed |

---

## 4. Phase 2 — AI Bot Layer

**Estimated effort: 3–4 days**

### 4.1 AI Service Class

Create `app/Services/ChatAIService.php`:

```php
class ChatAIService
{
    // System prompt scoped to VenQore domain knowledge
    private string $systemPrompt = <<<PROMPT
    You are Vena, the intelligent support assistant for VenQore ERP & POS.
    You help users with questions about features across: POS checkout, inventory,
    invoicing, supplier management, reporting, accounting, and platform settings.
    
    Rules:
    - Answer only VenQore-related questions.
    - If confidence is low or question is outside scope, set needs_handoff: true.
    - Detect handoff intent phrases: "human", "agent", "operator", "manager",
      "talk to someone", "real person", "not helping".
    - Respond in JSON: { "reply": "...", "needs_handoff": bool, "confidence": 0.0–1.0 }
    - Never fabricate pricing, feature availability, or billing specifics.
    PROMPT;

    public function respond(array $history, string $newMessage): array
    {
        // Build message array from session history
        // Call Claude API (claude-sonnet-4-20250514)
        // Parse JSON response
        // Return: ['reply' => '...', 'needs_handoff' => bool, 'confidence' => float]
    }
}
```

### 4.2 Confidence Threshold Configuration

In `config/chat.php`:

```php
return [
    'ai' => [
        'confidence_threshold'    => 0.65,   // Below this → trigger handoff
        'max_bot_turns_per_session' => 20,   // Force escalation review after N turns
        'typing_delay_ms'         => 800,    // Simulate natural typing pause
    ],
    'session' => [
        'idle_timeout_minutes'    => 10,     // Mark session idle if no message
        'claim_lock_ttl_seconds'  => 30,     // Agent claim lock expiry
        'offline_ticket_message'  => 'Our agents are offline. We have created a support ticket and will email you shortly.',
    ],
];
```

### 4.3 Handoff Intent Keywords

```php
// In ChatAIService or a dedicated IntentDetector class
private array $handoffKeywords = [
    'human', 'agent', 'operator', 'manager', 'real person',
    'talk to someone', 'support staff', 'not helping', 'frustrated',
    'escalate', 'complaint', 'refund issue', 'billing problem',
];

public function detectsHandoffIntent(string $message): bool
{
    $lower = strtolower($message);
    foreach ($this->handoffKeywords as $keyword) {
        if (str_contains($lower, $keyword)) return true;
    }
    return false;
}
```

---

## 5. Phase 3 — Handoff & Routing Logic

**Estimated effort: 2–3 days**

### 5.1 Message Processing Pipeline

In `app/Services/ChatRoutingService.php` — every incoming visitor message flows through this pipeline:

```
1. Save message to chat_messages (sender_type = 'visitor')
2. Broadcast MessageSent to chat.{uuid}
3. IF session.status != 'bot_active' → skip AI, queue for agent
4. IF session.ai_disabled = TRUE → skip AI
5. Run IntentDetector on message text
6. IF handoff intent detected → triggerHandoff(reason: 'intent_keyword')
7. ELSE → call ChatAIService::respond()
8. IF response.needs_handoff OR response.confidence < threshold → triggerHandoff(reason: 'low_confidence')
9. ELSE → save bot reply, broadcast, continue
```

### 5.2 `triggerHandoff()` Method

```php
public function triggerHandoff(ChatSession $session, string $reason): void
{
    DB::transaction(function () use ($session, $reason) {
        $session->update([
            'status'            => 'human_requested',
            'ai_disabled'       => true,
            'escalation_reason' => $reason,
        ]);

        // Post system message to session
        $this->postSystemMessage($session,
            "You've been connected to our support team. An agent will join shortly."
        );

        // Check if any agent is online
        $onlineAgent = $this->getOnlineAgent($session->tenant_id);

        if (!$onlineAgent) {
            // No agents online — post offline message + create ticket
            $this->postSystemMessage($session,
                config('chat.session.offline_ticket_message')
            );
            $this->createTicket($session);
        }

        // Broadcast to all agents' inbox
        broadcast(new AgentInboxUpdated($session))->toOthers();

        // Fire notification job
        dispatch(new NotifyAgentsOfEscalation($session));
    });
}
```

### 5.3 State Transition Guards

Add `ChatSessionObserver` to enforce valid state transitions and prevent illegal state overwrites:

```php
// Only allow these transitions
private array $validTransitions = [
    'bot_active'       => ['human_requested'],
    'human_requested'  => ['agent_claimed', 'idle_offline', 'bot_active'],
    'agent_claimed'    => ['agent_active', 'human_requested'],
    'agent_active'     => ['resolved', 'human_requested'],
    'idle_offline'     => ['human_requested', 'resolved'],
    'resolved'         => [],
];
```

---

## 6. Phase 4 — Agent Command Center (Filament)

**Estimated effort: 4–5 days**

### 6.1 Live Inbox Page

Create a custom Filament page `app/Filament/Pages/AgentInbox.php` with:

- **Left panel:** Active sessions list, sorted by priority:
  1. `human_requested` (not yet claimed) — highlighted red
  2. `agent_active` (claimed by current agent) — green
  3. `bot_active` — grey
- **Right panel:** Full conversation thread with real-time message feed

### 6.2 One-Click Takeover with Lock

The "Take Over" button must implement an optimistic lock to prevent two agents claiming the same session simultaneously:

```php
// AgentInbox Filament action
public function claimSession(ChatSession $session): void
{
    $lockToken = Str::uuid()->toString();
    $lockExpiry = now()->addSeconds(config('chat.session.claim_lock_ttl_seconds'));

    // Atomic claim attempt using conditional update
    $claimed = ChatSession::where('id', $session->id)
        ->where(function ($q) {
            $q->whereNull('claim_lock_token')
              ->orWhere('claim_lock_expires', '<', now()); // Expired lock
        })
        ->whereIn('status', ['human_requested', 'bot_active'])
        ->update([
            'status'            => 'agent_claimed',
            'claimed_by'        => auth()->id(),
            'claimed_at'        => now(),
            'claim_lock_token'  => $lockToken,
            'claim_lock_expires'=> $lockExpiry,
            'ai_disabled'       => true,
        ]);

    if (!$claimed) {
        // Another agent claimed it first — notify current agent
        $this->dispatch('claim-failed',
            message: 'This session was just claimed by another agent.'
        );
        return;
    }

    // Confirm to active status
    $session->refresh()->update(['status' => 'agent_active']);

    // Broadcast agent joined message to visitor
    broadcast(new AgentJoined($session, auth()->user()));
    broadcast(new AgentInboxUpdated($session));
}
```

### 6.3 Context Read-Back Panel

When an agent opens a session, the right panel must display:

- Full conversation history (bot + visitor messages), in chronological order
- A color-coded legend: `Bot` (purple), `Visitor` (white), `Agent` (blue), `System` (grey italic)
- Escalation reason badge (e.g. "Triggered by: low confidence")
- Visitor name, email (if provided), session start time

**Critical:** The agent should never need to ask "How can I help?" because the full context is immediately visible.

### 6.4 Agent Typing Broadcast

```php
// In AgentInbox Livewire component — debounced at 500ms
public function agentTyping(): void
{
    broadcast(new TypingStarted($this->session, 'agent', auth()->user()->name));
    
    // Upsert short-lived typing record
    AgentTypingEvent::updateOrCreate(
        ['session_id' => $this->session->id, 'agent_id' => auth()->id()],
        ['expires_at' => now()->addSeconds(5)]
    );
}
```

---

## 7. Phase 5 — Multi-Agent Conflict Prevention System

> **This is the most critical section.** Without it, two agents can reply to the same visitor simultaneously, causing confusion and doubling of responses.

**Estimated effort: 2–3 days**

### 7.1 Problem Scenarios

| Scenario | Without Protection | With Protection |
|---|---|---|
| Two agents click "Take Over" simultaneously | Both see success; both reply | Only first succeeds; second sees "already claimed" toast |
| Agent A claims, goes idle; Agent B tries | Session appears unclaimed but isn't | Lock TTL expires; Agent B can claim after 30s |
| Agent refreshes page mid-conversation | Another agent can claim | Re-claim validates same `claimed_by` |
| Agent replies while another is also typing | Two replies sent, visitor confused | Active ownership blocks second agent's send button |

### 7.2 Three-Layer Protection Architecture

#### Layer 1 — Database Optimistic Lock (Claim Phase)

Already described in Section 6.2. The `claim_lock_token` + `claim_lock_expires` pair ensures atomic claiming.

#### Layer 2 — Active Ownership Enforcement (Reply Phase)

```php
// In ChatMessageController::store()
public function store(Request $request, ChatSession $session): JsonResponse
{
    // For agent messages, validate active ownership
    if ($request->sender_type === 'agent') {
        if ($session->claimed_by !== auth()->id()) {
            return response()->json([
                'error' => 'session_ownership_conflict',
                'message' => 'This session is currently owned by another agent.',
                'owner' => $session->claimedByAgent?->name,
            ], 409);
        }

        if ($session->status !== 'agent_active') {
            return response()->json([
                'error' => 'invalid_session_state',
                'message' => 'Session is not in an active state.',
            ], 422);
        }
    }

    // Proceed with saving message
}
```

#### Layer 3 — Real-Time UI Lock (Frontend)

On the React/Livewire admin frontend, subscribe to `agent.inbox.{tenantId}` and `chat.{uuid}` channels. When `AgentJoined` or `SessionStatusChanged` is received:

```javascript
// In AgentInbox React component
Echo.private(`chat.${sessionUuid}`)
    .listen('AgentJoined', (e) => {
        if (e.agent.id !== currentAgentId) {
            // Disable this agent's reply box + show owner banner
            setSessionOwner(e.agent);
            setReplyDisabled(true);
        }
    })
    .listen('SessionStatusChanged', (e) => {
        if (e.status === 'resolved' || e.claimedBy !== currentAgentId) {
            setReplyDisabled(true);
        }
    });
```

### 7.3 Visual Ownership Indicators in Inbox

In the left session list panel, each session card must display:

- 🔴 **Red badge** — `human_requested`, unclaimed
- 🟢 **Green badge + avatar** — `agent_active`, claimed by Agent X (show their name/avatar)
- 🔵 **Blue badge** — `agent_claimed`, claim in progress (show spinner)
- **"CLAIMED BY SARA"** label overlaid if another agent owns it — reply button is hidden for all other agents

### 7.4 Heartbeat Lock Renewal

Agents must renew their lock token every 20 seconds while they have the session open:

```php
// Scheduled or polled every 20s from frontend
public function renewLock(ChatSession $session): void
{
    ChatSession::where('id', $session->id)
        ->where('claimed_by', auth()->id())
        ->update(['claim_lock_expires' => now()->addSeconds(30)]);
}
```

If the agent closes their browser without releasing, the lock expires in 30 seconds and another agent can claim.

### 7.5 Session Release / Transfer

```php
public function releaseSession(ChatSession $session): void
{
    if ($session->claimed_by !== auth()->id()) return;

    $session->update([
        'status'            => 'human_requested',
        'claimed_by'        => null,
        'claimed_at'        => null,
        'claim_lock_token'  => null,
        'claim_lock_expires'=> null,
    ]);

    $this->postSystemMessage($session,
        'The agent has returned you to the queue. Another agent will assist you shortly.'
    );

    broadcast(new AgentInboxUpdated($session));
}
```

---

## 8. Phase 6 — Notifications & Escalation

**Estimated effort: 1–2 days**

### 8.1 `NotifyAgentsOfEscalation` Job

```php
// Dispatched via Laravel Horizon when status → human_requested
class NotifyAgentsOfEscalation implements ShouldQueue
{
    public function handle(): void
    {
        $agents = User::where('tenant_id', $this->session->tenant_id)
                      ->role('agent')
                      ->get();

        foreach ($agents as $agent) {
            // Email notification
            $agent->notify(new EscalationAlert($this->session));

            // Slack webhook (if configured)
            if ($agent->slack_webhook_url) {
                Http::post($agent->slack_webhook_url, [
                    'text' => "🚨 Customer needs help on VenQore chat. Session: {$this->session->session_uuid}"
                ]);
            }
        }
    }
}
```

### 8.2 Idle AI Fallback

A scheduled job runs every 2 minutes:

```php
// In app/Console/Commands/HandleIdleSessions.php
// Schedule: $schedule->command('chat:handle-idle')->everyTwoMinutes();

ChatSession::where('status', 'human_requested')
    ->where('last_message_at', '<', now()->subMinutes(config('chat.session.idle_timeout_minutes')))
    ->whereDoesntHave('activeClaim')
    ->chunk(50, function ($sessions) {
        foreach ($sessions as $session) {
            $session->update(['status' => 'idle_offline']);
            // Post offline message
            // Create support ticket
        }
    });
```

### 8.3 Agent Online Presence

Track agent online status using a Redis key:

```php
// On admin login → set presence
Redis::setex("agent:online:{$agentId}", 300, 1); // 5 min TTL, renewed by heartbeat

// Check if any agent online
public function getOnlineAgent(int $tenantId): ?User
{
    return User::where('tenant_id', $tenantId)
               ->role('agent')
               ->get()
               ->first(fn($agent) => Redis::exists("agent:online:{$agent->id}"));
}
```

---

## 9. Phase 7 — React Frontend Chat Widget

**Estimated effort: 3–4 days**

### 9.1 Chat Widget State Architecture

```javascript
// useChatSession.js — custom hook
const useChatSession = (sessionUuid) => {
    const [messages, setMessages]         = useState([]);
    const [status, setStatus]             = useState('bot_active');
    const [agentName, setAgentName]       = useState(null);
    const [isTyping, setIsTyping]         = useState(false);
    const [isConnected, setIsConnected]   = useState(false);
    const db = useDexie(); // Offline cache

    useEffect(() => {
        // Subscribe to Reverb channel
        const channel = Echo.private(`chat.${sessionUuid}`)
            .listen('MessageSent', onMessage)
            .listen('TypingStarted', () => setIsTyping(true))
            .listen('TypingStopped', () => setIsTyping(false))
            .listen('AgentJoined', (e) => setAgentName(e.agent.name))
            .listen('SessionStatusChanged', (e) => setStatus(e.status));

        return () => channel.stopListening();
    }, [sessionUuid]);
};
```

### 9.2 Dexie Offline Cache

```javascript
// chatDb.js — Dexie schema
const db = new Dexie('VenQoreChat');
db.version(1).stores({
    sessions: 'uuid, status, createdAt',
    messages: '++id, sessionUuid, createdAt',
    pendingMessages: '++id, sessionUuid, body, createdAt',
});

// On reconnect, flush pending messages
async function flushPendingMessages(sessionUuid) {
    const pending = await db.pendingMessages
        .where('sessionUuid').equals(sessionUuid).toArray();
    for (const msg of pending) {
        await sendMessage(msg.body);
        await db.pendingMessages.delete(msg.id);
    }
}
```

### 9.3 Typing Indicator Component

```jsx
const TypingIndicator = ({ typingEntity }) => (
    typingEntity ? (
        <div className="typing-indicator">
            <span>{typingEntity} is typing</span>
            <span className="dot-animation">...</span>
        </div>
    ) : null
);
```

---

## 10. Phase 8 — Canned Responses & Productivity Tools

**Estimated effort: 1 day**

### 10.1 Slash Command Autocomplete

In the agent reply box, detect `/` prefix and trigger a dropdown:

```javascript
// In AgentReplyBox component
const handleInput = (value) => {
    if (value.startsWith('/')) {
        const query = value.slice(1).toLowerCase();
        const filtered = cannedResponses.filter(r =>
            r.shortcode.startsWith(query)
        );
        setSlashSuggestions(filtered);
    } else {
        setSlashSuggestions([]);
    }
};
```

### 10.2 Suggested Canned Responses for VenQore

Pre-seed these in `canned_responses`:

| Shortcode | Title | Body Preview |
|---|---|---|
| `/pricing` | Pricing Plans | "VenQore offers flexible plans starting from..." |
| `/reset` | Password Reset | "To reset your password, go to Settings → Security..." |
| `/barcode` | Barcode Setup | "To configure your barcode scanner, navigate to POS Settings..." |
| `/refund` | Refund Policy | "For product returns, go to Sales → Sales Returns and..." |
| `/woo` | WooCommerce Sync | "To connect WooCommerce, go to VenSynQ → 3-Click OAuth..." |
| `/report` | Reports Help | "Your 39+ reports are located under the Reports Factory module..." |
| `/trial` | Free Trial | "Your 14-day free trial includes all premium features..." |
| `/khata` | Khata/Credit | "The Khata system tracks customer credit. Go to Customers → Ledger..." |

---

## 11. Phase 9 — Offline & Resilience Layer

**Estimated effort: 1 day**

### 11.1 Connection Resilience

```javascript
// Echo reconnection handling
Echo.connector.pusher.connection.bind('disconnected', () => {
    showConnectionBanner('Reconnecting...');
    queueIncomingMessages(); // Store to Dexie
});

Echo.connector.pusher.connection.bind('connected', () => {
    hideConnectionBanner();
    flushPendingMessages(sessionUuid);
});
```

### 11.2 Session Recovery on Page Reload

On every page load, check Dexie for an existing session UUID:

```javascript
useEffect(() => {
    const savedUuid = await db.sessions.orderBy('createdAt').last();
    if (savedUuid && savedUuid.status !== 'resolved') {
        // Restore session — reconnect to existing Reverb channel
        restoreSession(savedUuid.uuid);
    }
}, []);
```

---

## 12. Phase 10 — Testing & QA Checklist

**Estimated effort: 2 days**

### Unit Tests (Pest)

- [ ] State machine: all valid transitions succeed; invalid transitions throw
- [ ] `detectsHandoffIntent()` catches all keyword variants
- [ ] Confidence threshold triggers handoff at exactly 0.65
- [ ] Optimistic lock prevents double-claim (concurrent requests test)
- [ ] Lock TTL expiry allows re-claim after 30 seconds
- [ ] Canned response shortcode lookup returns correct body

### Integration Tests

- [ ] Bot reply flow end-to-end (visitor message → AI → broadcast back)
- [ ] Handoff flow: visitor types "talk to human" → status changes → agent inbox updates
- [ ] Agent claim: two simultaneous claims, only one succeeds
- [ ] Offline scenario: no agents online → ticket created → email sent
- [ ] Session release: agent releases → session back to `human_requested`
- [ ] Resolved session: no further messages accepted

### Load Tests

- [ ] Simulate 100 concurrent WebSocket connections on Reverb
- [ ] Ensure Horizon queue processes escalation notifications within 2 seconds
- [ ] Dexie offline cache survives 5-minute disconnection + flush on reconnect

### Manual QA

- [ ] Typing indicator appears on visitor side when agent types
- [ ] Typing indicator appears on agent side when visitor types
- [ ] Agent inbox shows correct priority ordering
- [ ] "Claimed by Sara" banner prevents other agents from replying
- [ ] Slash command `/refund` populates reply box correctly
- [ ] System message "Javeria has joined the chat" appears correctly

---

## 13. Risk Register & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Two agents reply simultaneously | Medium | High | Three-layer lock (DB + API guard + UI block) |
| Reverb WebSocket server crash | Low | High | Auto-restart via Supervisor; HTTP fallback polling for message delivery |
| AI API rate limit / outage | Medium | Medium | Fallback: immediately trigger handoff if AI call fails after 3s timeout |
| Dexie IndexedDB quota exceeded | Low | Low | Cap offline cache at 500 messages per session; purge oldest |
| Agent forgets to release session | Medium | Medium | Lock TTL auto-expires in 30s; scheduled command marks stale claims |
| Malicious visitor flooding messages | Medium | Medium | Rate limit: max 10 messages/minute per session UUID via throttle middleware |
| Incorrect tenant data bleed | Low | Critical | All queries scoped by `tenant_id`; multi-tenant middleware enforces isolation |

---

## 14. Dependency Install Reference

```bash
# Backend
composer require laravel/reverb
composer require laravel/horizon
php artisan reverb:install
php artisan horizon:install

# Frontend
npm install laravel-echo pusher-js
npm install dexie

# Queues & Scheduling (add to Supervisor)
php artisan queue:work --queue=chat-notifications,default
php artisan schedule:run  # or use system cron
php artisan reverb:start --host=0.0.0.0 --port=8080
php artisan horizon
```

Add to `Procfile` or Supervisor config:

```ini
[program:reverb]
command=php /var/www/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true

[program:horizon]
command=php /var/www/artisan horizon
autostart=true
autorestart=true
```

---

## Implementation Timeline Summary

| Phase | Task | Days |
|---|---|---|
| 1 | Reverb WebSocket foundation, channels, events | 2–3 |
| 2 | AI bot service, intent detection, confidence engine | 3–4 |
| 3 | Routing service, state machine, handoff logic | 2–3 |
| 4 | Filament agent inbox, context panel, takeover UI | 4–5 |
| 5 | Multi-agent conflict prevention (locks + UI guards) | 2–3 |
| 6 | Notifications, idle fallback, agent presence | 1–2 |
| 7 | React chat widget, Dexie offline cache | 3–4 |
| 8 | Canned responses, slash commands | 1 |
| 9 | Offline resilience, session recovery | 1 |
| 10 | Testing, QA, load testing | 2 |
| **Total** | | **~21–28 days** |

---

> **Built for VenQore** — an ERP & POS platform running on absolute financial truth.
> This chatbot system is designed to match that same standard: zero message conflicts,
> zero missed escalations, and a seamless handoff every single time.
