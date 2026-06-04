import { X } from 'lucide-react';

import { Button } from './button';

type ButtonCloseProps = {
    onClose: () => void;
    disabled?: boolean;
    className?: string;
};

export function ButtonClose({ onClose, disabled = false, className }: ButtonCloseProps) {
    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            disabled={disabled}
            className={className}
            aria-label="Close"
        >
            <X className="size-4" />
        </Button>
    );
}
