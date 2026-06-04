import { Loader2 } from 'lucide-react';

import { cn } from '../lib/cn';

type SpinnerProps = {
    className?: string;
};

export default function Spinner({ className }: SpinnerProps) {
    return <Loader2 className={cn('size-4 animate-spin', className)} aria-hidden="true" />;
}
