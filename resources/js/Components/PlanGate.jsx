import React from 'react';
import LockedFeature from '@/Components/LockedFeature';

export default function PlanGate(props) {
    return <LockedFeature mode="gate" {...props} />;
}
