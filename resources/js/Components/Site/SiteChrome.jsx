/**
 * SiteChrome — header + page + footer + cookie consent, for public pages.
 *
 *   <SiteChrome underHeader>{hero…}</SiteChrome>
 *
 * `underHeader` lets a full-bleed hero paint beneath the transparent bar;
 * without it the page starts below the bar. Pages that already render their
 * own <main> (the V6 showcase ports) use <SiteHeader/> / <SiteFooter/> /
 * <CookieConsent/> directly instead — see useMarketingShell().
 */
import React, { useEffect } from 'react';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

/** The public shell owns document scrolling; the app shell locks it. */
export function useMarketingShell() {
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const app = document.getElementById('app');
        const prev = {
            shell: html.getAttribute('data-vq-shell'),
            htmlOverflowY: html.style.overflowY,
            htmlOverflowX: html.style.overflowX,
            bodyOverflow: body.style.overflow,
            bodyHeight: body.style.height,
            appHeight: app?.style.height,
            appOverflow: app?.style.overflow,
        };
        html.setAttribute('data-vq-shell', 'marketing');
        html.style.overflowY = 'auto';
        html.style.overflowX = 'clip';
        body.style.overflow = 'visible';
        body.style.height = 'auto';
        if (app) {
            app.style.height = 'auto';
            app.style.overflow = 'visible';
        }
        return () => {
            if (prev.shell) html.setAttribute('data-vq-shell', prev.shell);
            else html.removeAttribute('data-vq-shell');
            html.style.overflowY = prev.htmlOverflowY;
            html.style.overflowX = prev.htmlOverflowX;
            body.style.overflow = prev.bodyOverflow;
            body.style.height = prev.bodyHeight;
            if (app) {
                app.style.height = prev.appHeight;
                app.style.overflow = prev.appOverflow;
            }
        };
    }, []);
}

export default function SiteChrome({
    children,
    underHeader = false,
    footer = true,
    footerCta = true,
    className = '',
    mainClassName = '',
}) {
    useMarketingShell();
    return (
        <div className={`vq-site vq-app-body ${className}`} style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', minHeight: '100vh', overflow: 'visible', position: 'relative' }}>
            <SiteHeader />
            <main id="main" className={`vq-chrome-main ${mainClassName}`} data-under-header={underHeader ? '' : undefined}>
                {children}
            </main>
            {footer && <SiteFooter showCta={footerCta} />}
            <CookieConsent />
        </div>
    );
}

export { SiteHeader, SiteFooter };
