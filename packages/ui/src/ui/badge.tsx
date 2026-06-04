import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground hover:bg-primary/80 ',
        secondary: 'border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80 ',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/80 ',
        success: 'border-success bg-success text-success-foreground hover:bg-success/80 ',
        outline: 'text-foreground',
        new: 'border-primary/80 bg-primary/80 text-white hover:bg-primary/80 ',
        customSuccess: 'text-green-500 bg-green-200/80 hover:bg-green-200/60 border-success ',
        dark: 'bg-black text-white border-black hover:bg-black/80',
        backgroundNone: '',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
