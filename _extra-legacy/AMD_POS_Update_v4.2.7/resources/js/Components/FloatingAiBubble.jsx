import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X } from 'lucide-react';

/**
 * Floating AI Bubble - Draggable minimized AI assistant
 * 
 * Features:
 * - Draggable to any position
 * - Shows message count badge
 * - Click to re-open full modal
 * - Smooth animations
 */
export default function FloatingAiBubble({
    onClick,
    onClose,
    messageCount = 0
}) {
    const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const bubbleRef = useRef(null);
    const hasDragged = useRef(false);

    // Load saved position from sessionStorage
    useEffect(() => {
        const saved = sessionStorage.getItem('amd_ai_bubble_position');
        if (saved) {
            try {
                const pos = JSON.parse(saved);
                // Ensure position is within viewport
                setPosition({
                    x: Math.min(pos.x, window.innerWidth - 80),
                    y: Math.min(pos.y, window.innerHeight - 80)
                });
            } catch (e) { }
        }
    }, []);

    // Save position to sessionStorage
    useEffect(() => {
        if (!isDragging) {
            sessionStorage.setItem('amd_ai_bubble_position', JSON.stringify(position));
        }
    }, [position, isDragging]);

    const handleMouseDown = (e) => {
        if (e.target.closest('[data-close-button]')) return;

        setIsDragging(true);
        hasDragged.current = false;
        const rect = bubbleRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.preventDefault();
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 80));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 80));

        setPosition({ x: newX, y: newY });
        hasDragged.current = true;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch support for mobile
    const handleTouchStart = (e) => {
        if (e.target.closest('[data-close-button]')) return;

        const touch = e.touches[0];
        setIsDragging(true);
        hasDragged.current = false;
        const rect = bubbleRef.current.getBoundingClientRect();
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        });
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        const newX = Math.max(0, Math.min(touch.clientX - dragOffset.x, window.innerWidth - 80));
        const newY = Math.max(0, Math.min(touch.clientY - dragOffset.y, window.innerHeight - 80));

        setPosition({ x: newX, y: newY });
        hasDragged.current = true;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, dragOffset]);

    const handleClick = (e) => {
        if (!hasDragged.current && !e.target.closest('[data-close-button]')) {
            onClick();
        }
    };

    return (
        <div
            ref={bubbleRef}
            className={`fixed z-[150] select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
                left: position.x,
                top: position.y,
                transition: isDragging ? 'none' : 'box-shadow 0.3s ease'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Main Bubble */}
            <div
                onClick={handleClick}
                className={`relative group w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/30 flex items-center justify-center transition-transform ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
            >
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />

                {/* Icon */}
                <div className="relative z-10 text-white">
                    <Sparkles size={28} />
                </div>

                {/* Message count badge removed */}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    AI Assistant
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
            </div>

            {/* Close button */}
            <button
                data-close-button
                onClick={onClose}
                className="absolute -top-2 -left-2 w-6 h-6 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                title="Close assistant"
            >
                <X size={12} />
            </button>
        </div>
    );
}
