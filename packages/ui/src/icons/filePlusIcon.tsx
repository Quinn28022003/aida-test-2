import { FilePlus } from 'lucide-react';
import type { SVGProps } from 'react';

import { cn } from '../lib/cn';

export function FilePlusIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return <FilePlus className={cn('size-5', className)} strokeWidth={1.75} aria-hidden="true" {...props} />;
}
