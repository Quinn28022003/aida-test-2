import { MoreVertical } from 'lucide-react';
import type { SVGProps } from 'react';

import { cn } from '../lib/cn';

export function MoreVerticalIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return <MoreVertical className={cn('size-5', className)} strokeWidth={1.75} aria-hidden="true" {...props} />;
}
