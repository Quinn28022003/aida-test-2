import type { ReactNode } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface TooltipProps {
  label: string;
  children: ReactNode;
}

export function ToolTip({ children, label }: TooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
