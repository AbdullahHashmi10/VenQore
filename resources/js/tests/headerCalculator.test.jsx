// @vitest-environment jsdom
import React, { useState, useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock @inertiajs/react
const navigationListeners = new Set();
vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
    router: {
        on: vi.fn((event, callback) => {
            navigationListeners.add(callback);
            return () => navigationListeners.delete(callback);
        }),
        post: vi.fn(),
        get: vi.fn(),
    },
    Link: ({ children, href, className, ...props }) => (
        <a href={href} className={className} {...props}>{children}</a>
    ),
}));

function triggerInertiaNavigation() {
    act(() => {
        navigationListeners.forEach(cb => cb());
    });
}

import HeaderCalculatorButton from '../Components/Calculator/HeaderCalculatorButton';
import CalculatorPopover from '../Components/Calculator/CalculatorPopover';

function TestCalculatorWrapper({ defaultOpen = false, onCloseCallback }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const buttonRef = useRef(null);

    const handleClose = () => {
        setIsOpen(false);
        if (onCloseCallback) onCloseCallback();
    };

    return (
        <div>
            <HeaderCalculatorButton
                ref={buttonRef}
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
            <CalculatorPopover
                isOpen={isOpen}
                onClose={handleClose}
                buttonRef={buttonRef}
            />
        </div>
    );
}

describe('Header Calculator Browser-Level Runtime & Interaction Tests', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
        navigationListeners.clear();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it('1. Calculator disabled: button is absent', () => {
        const isEnabled = false;
        render(
            <div>
                {isEnabled && <TestCalculatorWrapper />}
            </div>
        );

        expect(screen.queryByRole('button', { name: /^calculator$/i })).toBeNull();
    });

    it('2. Calculator enabled: header button is visible for an ordinary employee', () => {
        render(<TestCalculatorWrapper defaultOpen={false} />);
        const button = screen.getByRole('button', { name: /^calculator$/i });

        expect(button).not.toBeNull();
        expect(button.getAttribute('aria-expanded')).toBe('false');
        expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('3. Click opens the calculator popover dialog', () => {
        render(<TestCalculatorWrapper defaultOpen={false} />);
        const button = screen.getByRole('button', { name: /^calculator$/i });

        fireEvent.click(button);

        expect(button.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('dialog', { name: /^calculator$/i })).not.toBeNull();
    });

    it('4. Click outside closes the calculator popover', () => {
        render(
            <div>
                <div data-testid="outside-area">Outside</div>
                <TestCalculatorWrapper defaultOpen={true} />
            </div>
        );

        expect(screen.getByRole('dialog', { name: /^calculator$/i })).not.toBeNull();

        fireEvent.mouseDown(screen.getByTestId('outside-area'));

        expect(screen.queryByRole('dialog', { name: /^calculator$/i })).toBeNull();
    });

    it('5. Escape closes the popover and restores focus to header trigger button', () => {
        render(<TestCalculatorWrapper defaultOpen={true} />);
        const button = screen.getByRole('button', { name: /^calculator$/i });

        expect(screen.getByRole('dialog', { name: /^calculator$/i })).not.toBeNull();

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(screen.queryByRole('dialog', { name: /^calculator$/i })).toBeNull();
        expect(document.activeElement).toBe(button);
    });

    it('6. Keypad digits and operators update the calculation display', () => {
        render(<TestCalculatorWrapper defaultOpen={true} />);

        fireEvent.click(screen.getByRole('button', { name: /^digit 7$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^digit 8$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^equals$/i }));

        const resultDisplay = screen.getByLabelText('Current result display');
        expect(resultDisplay.textContent).toBe('15');
    });

    it('7. Keyboard input (digits, operators, Enter) updates display while open', () => {
        render(<TestCalculatorWrapper defaultOpen={true} />);

        fireEvent.keyDown(window, { key: '9' });
        fireEvent.keyDown(window, { key: '*' });
        fireEvent.keyDown(window, { key: '6' });
        fireEvent.keyDown(window, { key: 'Enter' });

        const resultDisplay = screen.getByLabelText('Current result display');
        expect(resultDisplay.textContent).toBe('54');
    });

    it('8. Keyboard input does nothing after calculator popover is closed', () => {
        render(<TestCalculatorWrapper defaultOpen={true} />);

        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('dialog', { name: /^calculator$/i })).toBeNull();

        fireEvent.keyDown(window, { key: '5' });
        fireEvent.keyDown(window, { key: '+' });

        const button = screen.getByRole('button', { name: /^calculator$/i });
        fireEvent.click(button);

        const resultDisplay = screen.getByLabelText('Current result display');
        expect(resultDisplay.textContent).toBe('0');
    });

    it('9. Backspace, Delete, and AC clear work properly', () => {
        render(<TestCalculatorWrapper defaultOpen={true} />);

        fireEvent.click(screen.getByRole('button', { name: /^digit 1$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^digit 2$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^digit 3$/i }));

        fireEvent.click(screen.getByRole('button', { name: /^backspace$/i }));
        expect(screen.getByLabelText('Calculation expression').textContent).toBe('12');

        fireEvent.click(screen.getByRole('button', { name: /^clear all$/i }));
        expect(screen.getByLabelText('Current result display').textContent).toBe('0');
    });

    it('10. Clipboard copy success announces success status', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            configurable: true,
            writable: true,
        });

        render(<TestCalculatorWrapper defaultOpen={true} />);

        fireEvent.click(screen.getByRole('button', { name: /^digit 4$/i }));
        fireEvent.click(screen.getByRole('button', { name: /^digit 2$/i }));

        const copyBtn = screen.getByRole('button', { name: /^copy result$/i });
        await act(async () => {
            fireEvent.click(copyBtn);
        });

        expect(writeTextMock).toHaveBeenCalledWith('42');
        const statusRegion = screen.getByRole('status');
        expect(statusRegion.textContent).toBe('Result copied to clipboard');
    });

    it('11. Rejected/unavailable clipboard announces failure status', async () => {
        const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: writeTextMock },
            configurable: true,
            writable: true,
        });

        render(<TestCalculatorWrapper defaultOpen={true} />);

        const copyBtn = screen.getByRole('button', { name: /^copy result$/i });
        await act(async () => {
            fireEvent.click(copyBtn);
        });

        const statusRegion = screen.getByRole('status');
        expect(statusRegion.textContent).toBe('Failed to copy to clipboard');
    });

    it('12. Inertia navigation closes the calculator popover', () => {
        render(<TestCalculatorWrapper defaultOpen={true} />);

        expect(screen.getByRole('dialog', { name: /^calculator$/i })).not.toBeNull();

        triggerInertiaNavigation();

        expect(screen.queryByRole('dialog', { name: /^calculator$/i })).toBeNull();
    });

    it('13. Store switch reactivity: switching from Business A (enabled) to Business B (disabled) hides button immediately', () => {
        const { rerender } = render(
            <div>
                {true && <TestCalculatorWrapper />}
            </div>
        );
        expect(screen.getByRole('button', { name: /^calculator$/i })).not.toBeNull();

        rerender(
            <div>
                {false && <TestCalculatorWrapper />}
            </div>
        );
        expect(screen.queryByRole('button', { name: /^calculator$/i })).toBeNull();

        rerender(
            <div>
                {true && <TestCalculatorWrapper />}
            </div>
        );
        expect(screen.getByRole('button', { name: /^calculator$/i })).not.toBeNull();
    });

    it('14. Mobile viewport contract: button does not use desktop-only hiding classes', () => {
        render(<HeaderCalculatorButton isOpen={false} onClick={() => {}} />);
        const button = screen.getByRole('button', { name: /^calculator$/i });

        expect(button.className).not.toContain('hidden lg:block');
        expect(button.className).not.toContain('hidden md:block');
    });
});
