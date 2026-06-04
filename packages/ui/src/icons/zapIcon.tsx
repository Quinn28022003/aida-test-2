import { Zap } from 'lucide-react';
import type { SVGProps } from 'react';

import { cn } from '../lib/cn';

export function ZapIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return <Zap className={cn('size-5', className)} strokeWidth={1.75} aria-hidden="true" {...props} />;
}
