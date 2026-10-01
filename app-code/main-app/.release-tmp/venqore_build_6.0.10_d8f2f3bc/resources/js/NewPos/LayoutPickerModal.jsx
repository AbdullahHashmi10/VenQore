/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — Layout & Look Picker Modal (Interactive Visual Customizer)      ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Dedicated modal opened from "Want to change your look? Click here" in Settings.
 * Displays all starting point layouts with real-time miniature preview shell,
 * auto vs manual profile toggles, and instant application.
 */

import React, { useState } from 'react';
import { presets, presetComposition } from '@/LayoutLaw/engine';
import { PROFILES, DEFAULTS } from './settings';
import LayoutPreviewShell from './LayoutPreviewShell';

export default function LayoutPickerModal({
    open,
    onClose,
    prefs = DEFAULTS,
    setPrefs,
}) {
    if (!open) return null;

    const availablePresets = presets();
    const [selectedPreset, setSelectedPreset] = useState(prefs?.preset || 'column');
    const [autoMode, setAutoMode] = useState(Boolean(prefs?.auto));
    const [selectedProfile, setSelectedProfile] = useState(prefs?.profile || 'retail');
    const [navRail, setNavRail] = useState(prefs?.rail ?? true);
    const [seniorMode, setSeniorMode] = useState(Boolean(prefs?.ops?.senior));

    const handlePresetSelect = (presetId) => {
        setSelectedPreset(presetId);
        setAutoMode(false); // dropping to manual
    };

    const handleProfileSelect = (profileId) => {
        setSelectedProfile(profileId);
        setAutoMode(true);
        const match = PROFILES.find((p) => p.id === profileId);
        if (match) {
            // Find desk family preset
            setSelectedPreset(match.family.desk || 'column');
        }
    };

    const handleApply = () => {
        const comp = presetComposition(selectedPreset);
        setPrefs?.((prev) => ({
            ...prev,
            auto: autoMode,
            profile: selectedProfile,
            preset: selectedPreset,
            comp,
            rail: navRail,
            ops: {
                ...(prev.ops || {}),
                senior: seniorMode,
            },
        }));
        onClose?.();
    };

    const activePresetObj = availablePresets.find((p) => p.id === selectedPreset) || availablePresets[1];

    return (
        <div className="nqp-wizard-overlay" role="dialog" aria-modal="true" aria-label="Customize POS Look and Layout">
            <div className="nqp-wizard-modal nqp-layout-picker-modal">
                {/* Header */}
                <div className="nqp-wizard-header">
                    <div className="nqp-wizard-brand-badge">
                        <span className="sparkle-icon">🎨</span>
                        <span>POS Layout & Appearance Customizer</span>
                    </div>
                    <h2>Choose how you want your POS screen arranged</h2>
                    <p className="nqp-wizard-subtitle">
                        Select a starting point layout. Every layout adapts responsively according to the Layout Law.
                    </p>
                </div>

                {/* Body Content */}
                <div className="nqp-wizard-body">
                    <div className="nqp-layout-picker-grid">
                        {/* Left: Layout Choices & Mode Selection */}
                        <div className="nqp-layout-controls-col">
                            {/* Auto vs Manual Mode Switch */}
                            <div className="nqp-mode-box">
                                <div className="mode-toggle-row">
                                    <div>
                                        <b>{autoMode ? '🤖 Auto Mode (Recommended)' : '🛠️ Manual Layout'}</b>
                                        <p className="mode-desc">
                                            {autoMode
                                                ? 'Automatically picks the best geometry for your device screen size.'
                                                : 'Keeps your selected starting point fixed across screen sizes.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={`nqp-pill-toggle ${autoMode ? 'active' : ''}`}
                                        onClick={() => setAutoMode(!autoMode)}
                                    >
                                        {autoMode ? 'Auto: ON' : 'Auto: OFF'}
                                    </button>
                                </div>

                                {autoMode ? (
                                    <div className="nqp-auto-profile-picker">
                                        <span className="picker-lbl">Select your business counter profile:</span>
                                        <div className="profile-chips">
                                            {PROFILES.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className={`profile-chip ${selectedProfile === p.id ? 'active' : ''}`}
                                                    onClick={() => handleProfileSelect(p.id)}
                                                >
                                                    <b>{p.name}</b>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Starting Point Presets */}
                            <div className="nqp-preset-selector-section">
                                <span className="section-eyebrow">STARTING POINTS</span>
                                <div className="nqp-preset-buttons-list">
                                    {availablePresets.map((p) => {
                                        const isSelected = selectedPreset === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className={`nqp-preset-option-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => handlePresetSelect(p.id)}
                                            >
                                                <div className="preset-opt-hdr">
                                                    <b>{p.name}</b>
                                                    {isSelected ? <span className="check-tag">✓ Active</span> : null}
                                                </div>
                                                <span className="preset-opt-tagline">{p.tagline}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right: Live Miniature Preview Shell */}
                        <div className="nqp-layout-preview-col">
                            <div className="preview-title-bar">
                                <div>
                                    <span className="eyebrow">LIVE PREVIEW</span>
                                    <h3>{activePresetObj?.name || 'Layout'} Layout</h3>
                                </div>
                                <span className="preview-for-tag">{activePresetObj?.for}</span>
                            </div>

                            {/* Embedded Preview */}
                            <LayoutPreviewShell
                                preset={selectedPreset}
                                rail={navRail}
                                senior={seniorMode}
                                className="picker-embedded-preview"
                            />

                            {/* Why & Layout Law Note */}
                            {activePresetObj?.why ? (
                                <div className="nqp-layout-why-box">
                                    <b>Why this layout:</b> {activePresetObj.why}
                                </div>
                            ) : null}

                            {/* Quick Display Switches -- V6 checkbox spec (20x20, --vq-r-xs, tick) */}
                            <div className="nqp-preview-quick-switches">
                                <button
                                    type="button"
                                    className="quick-switch-item"
                                    onClick={() => setNavRail(!navRail)}
                                    aria-pressed={navRail}
                                >
                                    <span className={`nqp-checkbox ${navRail ? 'checked' : ''}`}>
                                        <span className="nqp-checkbox-tick" />
                                    </span>
                                    <span>Navigation Rail</span>
                                </button>
                                <button
                                    type="button"
                                    className="quick-switch-item"
                                    onClick={() => setSeniorMode(!seniorMode)}
                                    aria-pressed={seniorMode}
                                >
                                    <span className={`nqp-checkbox ${seniorMode ? 'checked' : ''}`}>
                                        <span className="nqp-checkbox-tick" />
                                    </span>
                                    <span>Large Text Mode</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="nqp-wizard-footer">
                    <button
                        type="button"
                        className="nqp-wizard-btn secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="nqp-wizard-btn primary success"
                        onClick={handleApply}
                    >
                        ✨ Apply Layout to Register
                    </button>
                </div>
            </div>
        </div>
    );
}
