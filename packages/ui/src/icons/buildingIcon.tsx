import { Building2 } from 'lucide-react';
import type { SVGProps } from 'react';

import { cn } from '../lib/cn';

export function BuildingIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
    return <Building2 className={cn('size-5', className)} strokeWidth={1.75} aria-hidden="true" {...props} />;
}
