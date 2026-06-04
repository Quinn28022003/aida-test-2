import { Badge, BuildingIcon } from '@aida/ui';
import Link from 'next/link';

type OrganizationCardProps = {
    name: string;
    role: string;
    memberCount: number;
    href: string;
};

export function OrganizationCard({ name, role, memberCount, href }: OrganizationCardProps) {
    return (
        <Link
            href={href}
            className="block rounded-2xl border border-transparent bg-card p-5 no-underline shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
            <div className="flex items-start gap-4">
                <BuildingIcon className="size-11 shrink-0 rounded-xl bg-blue-50 p-3 text-blue-600" />

                <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-lg font-semibold text-foreground">{name}</p>
                    <p className="m-0 mt-0.5 text-sm text-muted-foreground">{role}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                            Active
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
