import { Check } from 'lucide-react';

import { cn } from '../lib/cn';

type RuleMetIconProps = {
    className?: string;
};

export function RuleMetIcon({ className }: RuleMetIconProps) {
    return <Check className={cn('size-4 shrink-0', className)} aria-hidden="true" />;
}
