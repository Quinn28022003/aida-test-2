import { redirect } from 'next/navigation';

import { ROUTE_PATHS } from '@/constants/routePaths';

export default function Page() {
    redirect(ROUTE_PATHS.DASHBOARD);
}
