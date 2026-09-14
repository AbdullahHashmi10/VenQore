<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\DigitalProduct;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DigitalHubController extends Controller
{
    public function index()
    {
        $openChatsCount = SupportTicket::withoutTenantScope()
            ->where('source', 'partner_desk')
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        // Seed initial data if empty
        if (DigitalProduct::count() === 0) {
            DigitalProduct::create([
                'name' => 'VenQore Midnight POS Station',
                'description' => 'A beautiful standalone offline-first POS station equipped with Midnight Nebula interface and offline voucher injections.',
                'version' => 'v1.2.4',
                'is_done' => true,
                'status' => 'active',
                'platforms' => [
                    ['name' => 'Etsy', 'link' => 'https://etsy.com'],
                    ['name' => 'Gumroad', 'link' => 'https://gumroad.com']
                ]
            ]);
        }

        return Inertia::render('SuperAdmin/DigitalHub/Index', [
            'stats' => [
                'open_chats' => $openChatsCount,
            ]
        ]);
    }

    public function getProducts()
    {
        $products = DigitalProduct::latest()->get();
        return response()->json([
            'success' => true,
            'products' => $products
        ]);
    }

    public function createProduct(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'version'     => ['nullable', 'string', 'max:50'],
            'status'      => ['required', 'string', 'in:active,dev,soon'],
            'platforms'   => ['nullable', 'array'],
        ]);

        $product = DigitalProduct::create([
            'name'        => $validated['name'],
            'description' => $validated['description'],
            'version'     => $validated['version'] ?? 'v1.0.0',
            'status'      => $validated['status'],
            'is_done'     => $validated['status'] === 'active',
            'platforms'   => $validated['platforms'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'product' => $product
        ]);
    }

    public function updateProduct(Request $request, $id)
    {
        $product = DigitalProduct::findOrFail($id);

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'version'     => ['nullable', 'string', 'max:50'],
            'status'      => ['required', 'string', 'in:active,dev,soon'],
            'platforms'   => ['nullable', 'array'],
        ]);

        $product->update([
            'name'        => $validated['name'],
            'description' => $validated['description'],
            'version'     => $validated['version'],
            'status'      => $validated['status'],
            'is_done'     => $validated['status'] === 'active',
            'platforms'   => $validated['platforms'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'product' => $product
        ]);
    }

    public function deleteProduct($id)
    {
        $product = DigitalProduct::findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true
        ]);
    }

    public function chats()
    {
        $chats = SupportTicket::withoutTenantScope()
            ->where('source', 'partner_desk')
            ->with(['replies' => function ($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->latest('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'chats'   => $chats
        ]);
    }

    public function reply(Request $request, $ticket_id)
    {
        $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $ticket = SupportTicket::withoutTenantScope()
            ->where('source', 'partner_desk')
            ->findOrFail($ticket_id);

        $reply = SupportTicketReply::create([
            'ticket_id'         => $ticket->id,
            'author_id'         => auth()->id(),
            'body'              => $request->body,
            'is_platform_owner' => true,
        ]);

        // Auto transition to in_progress on reply
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        return response()->json([
            'success' => true,
            'reply'   => $reply->load('author:id,name')
        ]);
    }

    public function updateStatus(Request $request, $ticket_id)
    {
        $request->validate([
            'status' => ['required', 'string', 'in:open,in_progress,resolved,closed'],
        ]);

        $ticket = SupportTicket::withoutTenantScope()
            ->where('source', 'partner_desk')
            ->findOrFail($ticket_id);

        $ticket->update([
            'status'      => $request->status,
            'resolved_at' => in_array($request->status, ['resolved', 'closed']) ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'ticket'  => $ticket
        ]);
    }
}
