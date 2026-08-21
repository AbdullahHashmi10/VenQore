import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function RestaurantKitchen({ storeSlug, orders = [] }) {
  const [filter, setFilter] = useState('all');
  const [loadingId, setLoadingId] = useState(null);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const handleStatusChange = (orderId, newStatus) => {
    setLoadingId(orderId);
    router.post(
      `/${storeSlug}/restaurant/order/${orderId}/status`,
      { status: newStatus },
      {
        preserveScroll: true,
        onFinish: () => setLoadingId(null),
      }
    );
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'preparing':
        return 'bg-brand-500/15 text-brand-400 border-brand-500/30';
      case 'ready':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'served':
        return 'bg-neutral-500/15 text-ink-muted border-line-strong';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-neutral-500/15 text-ink-muted border-line-strong';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <Head title="Kitchen Display System (KDS)" />

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 text-xl">
              🍳
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Kitchen Display System (KDS)</h1>
              <p className="text-ink-muted text-sm">Real-time order tickets, item modifiers, and preparation status</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${storeSlug}/restaurant/dashboard`}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-interactive-hover text-neutral-200 font-medium text-sm transition-all border border-neutral-700 flex items-center gap-2"
          >
            <span>🍽️ Floor & Tables View</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'preparing', 'ready', 'served'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize border ${
              filter === st
                ? 'bg-neutral-800 text-white border-neutral-600 shadow-sm'
                : 'bg-neutral-900/60 text-ink-muted border-neutral-800 hover:border-line-strong hover:text-neutral-200'
            }`}
          >
            {st} {st !== 'all' && `(${orders.filter(o => o.status === st).length})`}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-neutral-900/50 border border-neutral-800 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-3">👨‍🍳</span>
            <h3 className="text-lg font-semibold text-neutral-200 mb-1">No orders in this queue</h3>
            <p className="text-ink-muted text-sm">Orders submitted from POS or table view will appear here immediately.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                  <div>
                    <span className="font-mono text-xs font-semibold text-brand-400 block">{order.order_number}</span>
                    <h3 className="text-lg font-bold text-white">Table {order.table_number || 'Takeaway'}</h3>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border capitalize mb-1 ${statusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-ink-muted block">⏱️ {order.time_elapsed_mins || 0} mins</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 mb-6">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/60">
                      <div className="flex items-center justify-between text-sm font-semibold text-white">
                        <span>{item.name}</span>
                        <span className="px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-md text-xs font-bold">
                          x{item.qty}
                        </span>
                      </div>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.modifiers.map((mod, mIdx) => (
                            <span key={mIdx} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-1xs rounded">
                              + {mod}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Change Buttons */}
              <div className="pt-3 border-t border-neutral-800 flex gap-2">
                {order.status === 'pending' && (
                  <button
                    disabled={loadingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'preparing')}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold text-xs transition-all"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    disabled={loadingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'ready')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition-all"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    disabled={loadingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'served')}
                    className="flex-1 py-2 bg-sunken hover:bg-interactive-hover text-ink-faint rounded-lg font-semibold text-xs transition-all"
                  >
                    Mark Served
                  </button>
                )}
                {order.status !== 'served' && order.status !== 'cancelled' && (
                  <button
                    disabled={loadingId === order.id}
                    onClick={() => handleStatusChange(order.id, 'cancelled')}
                    className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
