import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X, Sparkles } from 'lucide-react';

/**
 * ToolsSidebar — left navigation across the whole free-tools surface.
 *
 * Fed by App\Support\ToolRegistry (PHP) so the sidebar, hub page and
 * sitemap can never drift apart. Tools with status 'soon' render as
 * non-clickable, clearly-labelled items — showing the full planned set
 * makes the toolbox look deep and gives people a reason to come back,
 * without ever producing a dead link or a 404.
 *
 * Desktop: sticky left rail. Mobile: slide-down drawer behind a button,
 * so it never eats the top of the screen on a phone.
 */
export default function ToolsSidebar({ groups = [], currentSlug = null }) {
    const [open, setOpen] = useState(false);

    const Item = ({ tool }) => {
        const isCurrent = tool.slug === currentSlug;

        if (tool.status !== 'live' || !tool.href) {
            return (
                <div className="vq-tools-nav__item vq-tools-nav__item--soon" title="Coming soon">
                    <span className="vq-tools-nav__label">{tool.short}</span>
                    <span className="vq-badge vq-badge--soon">Soon</span>
                </div>
            );
        }

        return (
            <Link
                href={tool.href}
                onClick={() => setOpen(false)}
                aria-current={isCurrent ? 'page' : undefined}
                className="vq-tools-nav__item"
            >
                <span className="vq-tools-nav__label">{tool.short}</span>
            </Link>
        );
    };

    const Nav = () => {
        let smartCaptureTool = null;
        const filteredGroups = groups.map(group => {
            const sc = group.tools.find(t => t.slug === 'smart-capture');
            if (sc) {
                smartCaptureTool = sc;
            }
            return {
                ...group,
                tools: group.tools.filter(t => t.slug !== 'smart-capture')
            };
        }).filter(group => group.tools.length > 0);

        return (
            <nav className="vq-tools-nav" aria-label="Free tools">
                {smartCaptureTool && (
                    <div>
                        <p className="vq-tools-nav__group-label vq-tools-nav__group-label--accent">AI feature</p>
                        <Link
                            href={smartCaptureTool.href}
                            onClick={() => setOpen(false)}
                            aria-current={currentSlug === 'smart-capture' ? 'page' : undefined}
                            className="vq-tools-nav__item vq-tools-nav__item--feature"
                        >
                            <span className="vq-tools-nav__label">
                                <Sparkles size={15} aria-hidden="true" />
                                {smartCaptureTool.short}
                            </span>
                            <span className="vq-badge vq-badge--accent">Pro</span>
                        </Link>
                    </div>
                )}

                {filteredGroups.map((group) => (
                    <div key={group.key}>
                        <p className="vq-tools-nav__group-label">{group.label}</p>
                        <div className="vq-tools-nav__list">
                            {group.tools.map((tool) => (
                                <Item key={tool.slug} tool={tool} />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        );
    };

    return (
        <>
            {/* Mobile toggle */}
            <div className="vq-tools-nav__toggle">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    className="vq-btn vq-btn--secondary"
                    style={{ alignSelf: 'flex-start' }}
                >
                    {open ? <X size={16} /> : <Menu size={16} />}
                    All free tools
                </button>
                {open && (
                    <div className="vq-tools-nav__drawer">
                        <Nav />
                    </div>
                )}
            </div>

            {/* Desktop rail */}
            <aside className="vq-tools-nav__rail">
                <Nav />
            </aside>
        </>
    );
}
