type MetricRowProps = {
    label: string;
    value: string;
};

export function MetricRow({ label, value }: MetricRowProps) {
    return (
        <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground">{value}</span>
        </div>
    );
}
