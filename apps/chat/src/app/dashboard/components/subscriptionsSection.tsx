import { Button, Card, CardContent, CreditCardIcon, DollarSignIcon, ZapIcon } from '@aida/ui';

import { MetricRow } from './metricRow';

type SubscriptionsSectionProps = {
    canManageBilling: boolean;
};

export function SubscriptionsSection({ canManageBilling }: SubscriptionsSectionProps) {
    return (
        <section>
            <h3 className="mb-5 text-2xl font-semibold tracking-tight text-foreground">Subscriptions</h3>
            <div className="space-y-4">
                <Card className="overflow-hidden rounded-2xl border-0 bg-card shadow-sm">
                    <CardContent className="p-0">
                        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                            <div className="flex min-w-0 items-start gap-4">
                                <CreditCardIcon className="size-11 shrink-0 rounded-xl bg-violet-50 p-3 text-violet-600" />
                                <div>
                                    <p className="m-0 text-lg font-semibold text-foreground">{''}</p>
                                    <p className="m-0 mt-1 text-sm text-muted-foreground">{''}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="m-0 text-3xl font-semibold leading-none text-foreground">$0</p>
                                <p className="m-0 mt-1 text-sm text-muted-foreground">per month</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border bg-muted/50 px-5 py-4">
                            <div>
                                <p className="m-0 text-sm text-muted-foreground">Next billing date</p>
                                <p className="m-0 mt-1 text-lg font-semibold text-foreground">{''}</p>
                            </div>
                            {canManageBilling && (
                                <Button type="button" variant="outline" className="rounded-lg bg-card">
                                    Manage Plan
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="rounded-2xl border-0 bg-card shadow-sm">
                        <CardContent className="space-y-5 p-5">
                            <div className="flex items-center gap-3">
                                <ZapIcon className="size-11 shrink-0 rounded-xl bg-orange-50 p-3 text-orange-500" />
                                <p className="m-0 text-lg font-semibold text-foreground">Token Usage</p>
                            </div>
                            <div>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">This month</span>
                                    <span className="font-semibold text-foreground">0 / 0</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full w-0 rounded-full bg-orange-400" />
                                </div>
                            </div>
                            <div className="space-y-2 border-t border-border pt-4">
                                <MetricRow label="Input tokens" value="0" />
                                <MetricRow label="Output tokens" value="0" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-0 bg-card shadow-sm">
                        <CardContent className="space-y-5 p-5">
                            <div className="flex items-center gap-3">
                                <DollarSignIcon className="size-11 shrink-0 rounded-xl bg-emerald-50 p-3 text-emerald-600" />
                                <p className="m-0 text-lg font-semibold text-foreground">Current Costs</p>
                            </div>
                            <div>
                                <p className="m-0 text-sm text-muted-foreground">Month to date</p>
                                <p className="m-0 mt-1 text-4xl font-semibold tracking-tight text-foreground">$0</p>
                            </div>
                            <div className="space-y-2 border-t border-border pt-4">
                                <MetricRow label="API Usage" value="$0" />
                                <MetricRow label="Storage" value="$0" />
                                <MetricRow label="Other Services" value="$0" />
                            </div>
                            <p className="m-0 border-t border-border pt-4 text-sm text-muted-foreground">
                                Estimated month end:{' '}
                                <span className="font-semibold text-foreground">$0</span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
