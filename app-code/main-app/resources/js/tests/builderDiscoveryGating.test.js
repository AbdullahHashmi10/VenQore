import { describe, expect, it } from 'vitest';
import { visibleQuestions } from '../Components/Builder/useDiscovery';

const discovery = [
    { key: 'sells', type: 'multi', options: { time: 'My time' } },
    {
        key: 'stock_traits',
        type: 'multi',
        options: { serial: 'Serial or IMEI numbers' },
        show_if: { stock: ['catalogue', 'deep'] },
    },
    {
        key: 'mobile_tradein',
        type: 'choice',
        options: { yes: 'Yes' },
        applies_to: ['mobile_electronics'],
    },
];

describe('manual builder discovery gating', () => {
    it('hides specialist stock and trade questions for a no-stock freelancer', () => {
        const keys = visibleQuestions(
            discovery,
            { sells: ['time'], stock: 'none' },
            'professional_services',
        ).map((question) => question.key);

        expect(keys).toEqual(['sells']);
    });

    it('shows conditional questions only when their answer and preset gates pass', () => {
        const keys = visibleQuestions(
            discovery,
            { stock: 'catalogue' },
            'mobile_electronics',
        ).map((question) => question.key);

        expect(keys).toEqual(['sells', 'stock_traits', 'mobile_tradein']);
    });
});
