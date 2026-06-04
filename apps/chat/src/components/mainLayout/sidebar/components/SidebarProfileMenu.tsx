'use client';

import { useState } from 'react';
import {
    Avatar,
    AvatarFallback,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    cn,
} from '@aida/ui';

import { buildProfileInitials } from '../lib/nav';
import { AuthService } from '@/services/auth.service';
import type { useAuth } from '@/lib/auth/session';

interface SidebarProfileMenuProps {
    profileLabel: string;
    authStatus: ReturnType<typeof useAuth>['status'];
}

export function SidebarProfileMenu({ profileLabel, authStatus }: SidebarProfileMenuProps) {
    const [signOutPending, setSignOutPending] = useState(false);
    const profileInitials = buildProfileInitials(profileLabel);

    const handleSignOut = async () => {
        if (signOutPending || authStatus === 'loading') {
            return;
        }

        setSignOutPending(true);

        try {
            await AuthService.signOut();
        } catch {
            setSignOutPending(false);
        }
    };

    return (
        <div className="mt-auto w-full px-2 pt-4 2xl:px-0">
            <DropdownMenu>
                <DropdownMenuTrigger
                    className={cn(
                        'rounded-full outline-none transition hover:bg-muted',
                        'flex h-14 w-14 items-center justify-center border border-border/80 bg-linear-to-b from-slate-50 to-slate-100 p-1',
                        'shadow-inner',
                        '2xl:h-auto 2xl:justify-start 2xl:p-2 2xl:w-full',
                    )}
                    aria-label="Profile options"
                >
                    <div
                        className={cn(
                            'flex items-center justify-center',
                            '2xl:justify-start 2xl:gap-3 2xl:px-1',
                        )}
                        title={profileLabel}
                    >
                        <Avatar className="size-9 rounded-full ring-1 ring-slate-300/70 2xl:size-10">
                            <AvatarFallback className="rounded-full bg-slate-800 text-xs font-semibold tracking-wide text-white">
                                {profileInitials}
                            </AvatarFallback>
                        </Avatar>
                        <span className="hidden truncate text-sm font-semibold text-slate-700 2xl:inline">
                            {profileLabel}
                        </span>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-48">
                    <DropdownMenuLabel>{profileLabel}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Search</DropdownMenuItem>
                    <DropdownMenuItem>Menu</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => void handleSignOut()}
                        disabled={authStatus === 'loading' || signOutPending}
                    >
                        {signOutPending ? 'Signing out...' : 'Sign out'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
