import React from 'react';
import { Link } from '@inertiajs/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SmartCaptureNudge({ documentType = 'invoice' }) {
    return (
        <div className="vq-nudge">
            <div className="vq-nudge__body">
                <div className="vq-tile__icon" aria-hidden="true">
                    <Sparkles size={20} />
                </div>
                <div>
                    <p className="vq-nudge__title">Create this {documentType} with Smart Capture AI</p>
                    <p className="vq-nudge__text">
                        Tired of typing line items by hand? Upload any vendor bill, handwritten list or photo and let AI read it in seconds. The free tier includes <strong>5 pages a month</strong>.
                    </p>
                </div>
            </div>
            <Link href="/tools/smart-capture" className="vq-btn vq-btn--quiet">
                Use Smart Capture <ArrowRight size={16} className="vq-btn__arrow" aria-hidden="true" />
            </Link>
        </div>
    );
}
