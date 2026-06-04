import { LoadingSpinner } from '@aida/ui';

type AuthRedirectLoadingProps = {
    text?: string;
};

export function AuthRedirectLoading({ text = 'Redirecting' }: AuthRedirectLoadingProps) {
    return (
        <div className="relative min-h-screen">
            <LoadingSpinner text={text} />
        </div>
    );
}
