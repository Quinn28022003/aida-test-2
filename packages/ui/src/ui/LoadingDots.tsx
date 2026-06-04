import { cn } from '../lib/cn';

type TAnimationSpeed = 'slow' | 'normal' | 'fast';

type TSpeedDurations = Record<TAnimationSpeed, string>;

interface ILoadingDotsProps {
  text?: string;
  notText?: boolean;
  textColor?: string;
  dotColor?: string;
  animationSpeed?: TAnimationSpeed;
}

export const LoadingDots = (props: ILoadingDotsProps) => {
  const { text = 'Loading', textColor = '', notText, dotColor = 'text-current', animationSpeed = 'fast' } = props;

  const speedDurations: TSpeedDurations = {
    slow: '3s',
    normal: '2s',
    fast: '1s',
  } as const;

  const duration = speedDurations[animationSpeed];

  return (
    <span className="flex items-center">
      {!notText && (
        <span className={cn('text-primary font-headline font-semibold tracking-wide', textColor)}>{text}</span>
      )}
      <span className="flex">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={dotColor}
            style={{
              animation: `dotAppear ${duration} infinite`,
              animationDelay: `calc(${duration} / 3 * ${index})`,
            }}
          >
            .
          </span>
        ))}
      </span>
    </span>
  );
};
