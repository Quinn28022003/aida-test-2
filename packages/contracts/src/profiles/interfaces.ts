import type { IAgentsService } from '../agents/interfaces';
import type { IOrganizationsContextService } from '../organizations/interfaces';
import type { TAuthUserParams, TRepositoryClientParams } from '../params.types';
import type { IProjectsContextService } from '../projects/interfaces';
import type {
    TMeContext,
    TProfile,
    TProfileAuthUserParams,
    TProfilesRepositoryClient,
    TResolvedMeContext,
} from './types';

export interface IProfilesRepository<TClient = TProfilesRepositoryClient> {
    getByAuthUserId(params: TRepositoryClientParams<TClient> & TAuthUserParams): Promise<TProfile | null>;
}

export interface IProfilesService {
    getByAuthUserId(params: TProfileAuthUserParams): Promise<TProfile>;
    getMeContext(params: TProfileAuthUserParams): Promise<TResolvedMeContext>;
}

export interface IProfilesContextService {
    getMeContext(params: TProfileAuthUserParams): Promise<TMeContext>;
}

export interface IProfilesServiceDependencies {
    agentService: IAgentsService;
    organizationService: IOrganizationsContextService;
    projectService: IProjectsContextService;
}
