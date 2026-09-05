import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Wifi, WifiOff, Lock, AlertTriangle, Clock } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';

export default function TerminalStatusBadge() {
    const { terminals } = usePage().props;
    // Force re-render every minute to update "X mins ago"
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    if (!terminals || terminals.length === 0) {
        // Optional: Show "Setup Needed" if no terminals found
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sunken text-ink-muted text-2xs font-bold tracking-wider">
                <WifiOff size={14} />
                <span>NO STATION</span>
            </div>
        );
    }

    // Use the most recently active terminal as the "Main" indicator
    // or just the first one.
    const terminal = terminals[0];

    const lastHeartbeat = terminal.last_heartbeat_at ? new Date(terminal.last_heartbeat_at) : null;
    const now = new Date();
    // Calculate difference in minutes. Handle timezone roughly if needed, 
    // but usually new Date(iso_string) works well in browser.
    // Note: Server sends UTC or server time. We should ensure compatibility.
    // Ideally we comparing UTC to UTC.
    const diffMinutes = lastHeartbeat ? (now.getTime() - lastHeartbeat.getTime()) / 1000 / 60 : 999999;

    let statusConfig = {
        color: 'bg-red-500',
        textColor: 'text-white',
        icon: <WifiOff size={13} />,
        label: 'OFFLINE',
        description: 'Connection lost. Data may be stale.'
    };

    // LOGIC MATRIX
    const isClosedSignal = terminal.status === 'CLOSED_NORMALLY' || terminal.status === 'CLOSED';
    const isStrikeSignal = terminal.status === 'STRIKE';
    const isLive = diffMinutes < 2.5; // Give 30s buffer over 2 mins

    if (isLive && !isClosedSignal && !isStrikeSignal) {
        statusConfig = {
            color: 'bg-emerald-500 ',
            textColor: 'text-white',
            icon: <Wifi size={13} />,
            label: 'LIVE',
            description: 'Shop is online and syncing.'
        };
    } else if (isClosedSignal) {
        statusConfig = {
            color: 'bg-neutral-500 dark:bg-raised border border-line-strong',
            textColor: 'text-white',
            icon: <Lock size={13} />,
            label: 'CLOSED',
            description: 'Shop was closed normally.'
        };
    } else if (isStrikeSignal) {
        statusConfig = {
            color: 'bg-orange-500',
            textColor: 'text-white',
            icon: <AlertTriangle size={13} />,
            label: 'ALERT',
            description: `Shop closed: ${terminal.last_status_reason || 'Strike/Emergency'}`
        };
    } else {
        // RED STATE (Offline unexpectedly)
        statusConfig = {
            color: 'bg-red-500 animate-pulse',
            textColor: 'text-white',
            icon: <WifiOff size={13} />,
            label: 'OFFLINE',
            description: `Last seen ${Math.floor(diffMinutes)} mins ago. Check internet.`
        };
    }

    return (
        <Popover className="relative">
            <Popover.Button className="outline-none">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.textColor} text-2xs font-bold tracking-widest shadow-lg ${statusConfig.color} transition-all duration-slow cursor-pointer active:scale-95`}>
                    {statusConfig.icon}
                    <span>{statusConfig.label}</span>
                </div>
            </Popover.Button>

            <Transition
                enter="transition duration-fast ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-fast ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
            >
                <Popover.Panel className="absolute z-50 mt-2 bg-surface rounded-[14px] shadow-xl border border-line p-3 w-48 right-0">
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-ink-secondary dark:text-ink border-b border-line pb-1">
                            {terminal.name}
                        </div>
                        <div className="text-2xs text-ink-muted leading-relaxed">
                            {statusConfig.description}
                        </div>
                        {lastHeartbeat && (
                            <div className="flex items-center gap-1 text-3xs text-ink-muted font-mono pt-1">
                                <Clock size={10} />
                                <span>{lastHeartbeat.toLocaleTimeString()}</span>
                            </div>
                        )}
                        <div className="text-3xs text-neutral-300 dark:text-ink-secondary font-mono pt-1">
                            ID: {terminal.id} • IP: {terminal.ip_address || 'N/A'}
                        </div>
                    </div>
                </Popover.Panel>
            </Transition>
        </Popover>
    );
}
