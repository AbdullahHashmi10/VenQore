<?php

use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\Tenant;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    $this->tenant = $this->createTenant('smoke-test-store');
    $this->owner = $this->createTenantUser($this->tenant, 'owner');
    $this->actingAs($this->owner);
    $this->bindTenantContext($this->tenant, $this->owner);
});

test('platform admin can view support tickets list', function () {
    // 1. Create mock tickets
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Printer not working',
        'message' => 'The POS printer does not print receipts.',
        'status' => 'open',
        'priority' => 'high',
        'source' => 'manual',
    ]);

    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'AI Handoff Requested',
        'message' => 'Customer wants to talk to a human.',
        'status' => 'in_progress',
        'priority' => 'urgent',
        'source' => 'vena_chat',
    ]);

    // 2. Act as SuperAdmin
    app()->forgetInstance('current.tenant');
    $this->actingAsSuperAdmin();

    // 3. Make request
    $response = $this->get(route('platform.tickets'));
    
    // 4. Assert success and presence of Inertia properties
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('SuperAdmin/Dashboard')
        ->where('tab', 'support')
        ->has('tickets')
        ->has('tickets_total')
        ->has('open_count')
    );
});

test('platform admin can fetch specific ticket details with replies', function () {
    // 1. Create a ticket
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Billing Question',
        'message' => 'How do I add a new cashier?',
        'status' => 'open',
        'priority' => 'normal',
    ]);

    // 2. Add a reply
    SupportTicketReply::create([
        'ticket_id' => $ticket->id,
        'author_id' => $this->owner->id,
        'body' => 'I already solved this by updating my plan.',
        'is_platform_owner' => false,
    ]);

    // 3. Act as SuperAdmin
    app()->forgetInstance('current.tenant');
    $this->actingAsSuperAdmin();

    // 4. Fetch details
    $response = $this->get(route('platform.ticket.show', ['ticket' => $ticket->id]));
    
    // 5. Assert correct JSON structure and values
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'id',
        'subject',
        'message',
        'replies' => [
            '*' => [
                'id',
                'body',
                'is_platform_owner',
                'author' => ['id', 'name'],
            ]
        ]
    ]);
});

test('platform admin can reply to a support ticket', function () {
    // 1. Create a ticket
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Tax Setup',
        'message' => 'Please explain inclusive vs exclusive tax.',
        'status' => 'open',
        'priority' => 'normal',
    ]);

    // 2. Act as SuperAdmin
    app()->forgetInstance('current.tenant');
    $this->actingAsSuperAdmin();

    // 3. Send reply
    $response = $this->post(route('platform.ticket.reply', ['ticket' => $ticket->id]), [
        'body' => 'Exclusive tax is added at checkout, inclusive is built-in.',
    ]);

    // 4. Assert redirect and DB state
    $response->assertRedirect();
    $this->assertDatabaseHas('support_ticket_replies', [
        'ticket_id' => $ticket->id,
        'body' => 'Exclusive tax is added at checkout, inclusive is built-in.',
        'is_platform_owner' => true,
    ]);

    // Status should auto-update to in_progress
    $ticket->refresh();
    expect($ticket->status)->toBe('in_progress');
});

test('platform admin can update support ticket status', function () {
    // 1. Create a ticket
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Connection Drop',
        'message' => 'Vite drops connection occasionally.',
        'status' => 'open',
        'priority' => 'low',
    ]);

    // 2. Act as SuperAdmin
    app()->forgetInstance('current.tenant');
    $this->actingAsSuperAdmin();

    // 3. Update status to resolved
    $response = $this->post(route('platform.ticket.status', ['ticket' => $ticket->id]), [
        'status' => 'resolved',
    ]);

    // 4. Assert redirect and DB updated
    $response->assertRedirect();
    
    $ticket->refresh();
    expect($ticket->status)->toBe('resolved');
    expect($ticket->resolved_at)->not->toBeNull();
});

test('platform admin can batch update store feature flags', function () {
    // 1. Act as SuperAdmin
    app()->forgetInstance('current.tenant');
    $this->actingAsSuperAdmin();

    // 2. Send batch save overrides request
    $response = $this->post(route('platform.store.feature-flag', ['tenant' => $this->tenant->id]), [
        'features' => [
            'woocommerce' => true,
            'api_access' => false,
            'growth_engine' => true,
            'multi_branch' => false,
        ]
    ]);

    // 3. Assert redirect and plan limits are saved in JSON column
    $response->assertRedirect();
    
    $this->tenant->refresh();
    $limits = $this->tenant->plan_limits;
    
    expect($limits['woocommerce'])->toBeTrue();
    expect($limits['api_access'])->toBeFalse();
    expect($limits['growth_engine'])->toBeTrue();
    expect($limits['multi_branch'])->toBeFalse();
});

test('store staff can view store support tickets', function () {
    SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Store Printer Issue',
        'message' => 'Store POS printer is jammed.',
        'status' => 'open',
        'priority' => 'high',
        'source' => 'vena_chat',
    ]);

    $response = $this->get(route('store.admin.vena.tickets', ['store_slug' => $this->tenant->slug]));
    
    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/VenaTickets')
        ->where('context', 'store')
        ->has('tickets')
        ->has('open_count')
    );
});

test('store staff can manually create support ticket', function () {
    $response = $this->post(route('store.admin.vena.ticket.create', ['store_slug' => $this->tenant->slug]), [
        'requester_name' => 'Alice Customer',
        'requester_email' => 'alice@customer.com',
        'subject' => 'Missing order item',
        'message' => 'I ordered three items but only received two.',
        'priority' => 'high',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('support_tickets', [
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Missing order item',
        'message' => 'I ordered three items but only received two.',
        'status' => 'open',
        'priority' => 'high',
        'source' => 'vena_chat',
        'requester_name' => 'Alice Customer',
        'requester_email' => 'alice@customer.com',
    ]);
});

test('store staff can update store support ticket status', function () {
    $ticket = SupportTicket::create([
        'tenant_id' => $this->tenant->id,
        'submitted_by' => $this->owner->id,
        'subject' => 'Damaged Goods',
        'message' => 'Item arrived broken.',
        'status' => 'open',
        'priority' => 'normal',
        'source' => 'vena_chat',
    ]);

    $response = $this->post(route('store.admin.vena.ticket.status', [
        'store_slug' => $this->tenant->slug,
        'ticket' => $ticket->id,
    ]), [
        'status' => 'resolved',
    ]);

    $response->assertRedirect();
    $ticket->refresh();
    expect($ticket->status)->toBe('resolved');
    expect($ticket->resolved_at)->not->toBeNull();
});
