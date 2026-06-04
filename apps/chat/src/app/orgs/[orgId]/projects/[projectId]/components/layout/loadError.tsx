import { Button, Card, CardContent, CardHeader, CardTitle } from '@aida/ui';

type LayoutLoadErrorProps = {
    onRetry: () => void;
};

export function LayoutLoadError({ onRetry }: LayoutLoadErrorProps) {
    return (
        <div className="p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Could not load the chat workspace</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>Please retry in a moment.</p>
                    <Button type="button" onClick={() => void onRetry()}>
                        Retry
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
