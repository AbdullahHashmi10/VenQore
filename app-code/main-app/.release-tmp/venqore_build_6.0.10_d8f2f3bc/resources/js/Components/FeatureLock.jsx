import React from 'react';
import { usePage } from '@inertiajs/react';
import LockedFeature from '@/Components/LockedFeature';

export function useFeature(key) {
    const { plan, store } = usePage().props;
    const features = plan?.features ?? store?.features ?? {};
    if (!(key in features)) return null;
    return Boolean(features[key]);
}

export default function FeatureLock(props) {
    return <LockedFeature mode="lock" {...props} />;
}
