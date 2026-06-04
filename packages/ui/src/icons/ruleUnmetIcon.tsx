import { X } from 'lucide-react';

import { cn } from '../lib/cn';

type RuleUnmetIconProps = {
    className?: string;
};

export function RuleUnmetIcon({ className }: RuleUnmetIconProps) {
    return <X className={cn('size-4 shrink-0', className)} aria-hidden="true" />;
}
