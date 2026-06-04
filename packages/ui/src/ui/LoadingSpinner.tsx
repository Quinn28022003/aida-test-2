import { cn } from '../lib/cn';
import { LoadingDots } from './LoadingDots';

interface ILoadingSpinnerProps {
  className?: string;
  text?: string;
}

export function LoadingSpinner(props: ILoadingSpinnerProps) {
  const { className, text } = props;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/80 bg-dot">
      <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
        {/* Spinner animation */}
        <div className="relative h-12 w-12">
          {/* Outer circle */}
          <div className="absolute h-full w-full rounded-full border-4 border-muted"></div>

          {/* Animated arc */}
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary"></div>
        </div>

        {/* Loading text with dots */}
        <LoadingDots text={text} dotColor="text-primary font-bold" animationSpeed="fast" />
      </div>
    </div>
  );
}
