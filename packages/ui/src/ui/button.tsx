import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import * as React from 'react';

import { cn } from '../lib/cn';
import { LoadingDots } from './LoadingDots';
import { ToolTip } from './tooltip-wrapper';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow-md hover:bg-primary-hover',
                destructive:
                    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                outline:
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-xl px-8',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    children: React.ReactNode;
    label?: string;
    showTooltip?: boolean;
    loadingDots?: boolean;
    textLoading?: string;
    dotColor?: string;
    href?: string;
    target?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            children,
            disabled,
            label,
            showTooltip,
            loadingDots,
            textLoading,
            dotColor = 'text-primary-foreground',
            href,
            target,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';

        const buttonContent = (
            <Comp
                className={cn(buttonVariants({ variant, size, className }), disabled && 'opacity-50 cursor-not-allowed')}
                ref={ref}
                disabled={disabled}
                onClick={disabled ? undefined : props.onClick}
                {...props}
            >
                <div className={cn('flex items-center', !loadingDots && 'gap-2')}>
                    {!loadingDots && children}
                    {loadingDots && (
                        <>
                            <span>{textLoading}</span>
                            <LoadingDots notText dotColor={dotColor} animationSpeed="fast" />
                        </>
                    )}
                </div>
            </Comp>
        );

        // Wrap with tooltip if label is provided and showTooltip is true
        if (label && showTooltip) {
            return <ToolTip label={label}>{buttonContent}</ToolTip>;
        }

        if (href) {
            return (
                <Link target={target} href={href}>
                    {buttonContent}
                </Link>
            );
        }

        return buttonContent;
    },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
