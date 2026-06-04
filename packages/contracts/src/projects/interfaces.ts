import type { TProfile } from '../profiles/types';
import type { TOrganizationGroup, TOrganizationMembership, TOrganizationRole } from '../organizations/types';
import type {
    TAuthUserParams,
    TGroupIdsParams,
    TInputParams,
    TJobIdsParams,
    TJobParams,
    TOrgParams,
    TProjectIdsParams,
    TProjectParams,
    TRepositoryClientParams,
    TRoleIdsParams,
    TUserParams,
} from '../params.types';
import type {
    TJob,
    TJobActorParams,
    TJobCreateParams,
    TJobMembership,
    TJobUpdateParams,
    TProject,
    TProjectActorParams,
    TProjectCreateParams,
    TProjectDirectPermissionGrant,
    TProjectJobUserScopeParams,
    TProjectMemberCreateParams,
    TProjectMemberDeleteParams,
    TProjectMembership,
    TProjectMemberRoleLink,
    TProjectRolePermission,
    TProjectsRepositoryCreateJobInput,
    TProjectsRepositoryCreateProjectInput,
    TProjectsRepositoryCreateProjectMemberInput,
    TProjectsRepositoryUpdateJobInput,
    TProjectsRepositoryUpdateProjectInput,
    TProjectsRepositoryClient,
    TProjectUpdateParams,
    TProjectUserScopeParams,
} from './types';

export interface IProjectsRepository<TClient = TProjectsRepositoryClient> {
    getProfileByAuthUserId(params: TRepositoryClientParams<TClient> & TAuthUserParams): Promise<TProfile | null>;
    getOrganizationMembership(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<TOrganizationMembership | null>;
    getProjectById(params: TRepositoryClientParams<TClient> & TProjectParams): Promise<TProject | null>;
    listProjectsByOrgId(params: TRepositoryClientParams<TClient> & TOrgParams): Promise<TProject[]>;
    listProjectsByIds(params: TRepositoryClientParams<TClient> & TProjectIdsParams): Promise<TProject[]>;
    createProject(params: TRepositoryClientParams<TClient> & TInputParams<TProjectsRepositoryCreateProjectInput>): Promise<TProject>;
    updateProjectById(params: TRepositoryClientParams<TClient> & TProjectParams & TInputParams<TProjectsRepositoryUpdateProjectInput>): Promise<TProject>;
    listProjectMembers(params: TRepositoryClientParams<TClient> & TProjectParams): Promise<TProjectMembership[]>;
    getProjectMemberByUserId(params: TRepositoryClientParams<TClient> & TProjectParams & TUserParams): Promise<TProjectMembership | null>;
    listProjectMembershipsByUserId(params: TRepositoryClientParams<TClient> & TProjectUserScopeParams): Promise<TProjectMembership[]>;
    createProjectMember(params: TRepositoryClientParams<TClient> & TInputParams<TProjectsRepositoryCreateProjectMemberInput>): Promise<TProjectMembership>;
    deleteProjectMemberByProjectAndUserId(params: TRepositoryClientParams<TClient> & TProjectParams & TUserParams): Promise<TProjectMembership | null>;
    listJobsByProjectId(params: TRepositoryClientParams<TClient> & TProjectParams): Promise<TJob[]>;
    listJobsByIds(params: TRepositoryClientParams<TClient> & TJobIdsParams): Promise<TJob[]>;
    getJobById(params: TRepositoryClientParams<TClient> & TJobParams): Promise<TJob | null>;
    createJob(params: TRepositoryClientParams<TClient> & TInputParams<TProjectsRepositoryCreateJobInput>): Promise<TJob>;
    updateJobById(params: TRepositoryClientParams<TClient> & TJobParams & TInputParams<TProjectsRepositoryUpdateJobInput>): Promise<TJob>;
    listJobMembershipsByUserId(params: TRepositoryClientParams<TClient> & TProjectJobUserScopeParams): Promise<TJobMembership[]>;
    listJobMembersByJobId(params: TRepositoryClientParams<TClient> & TProjectParams & TJobParams): Promise<TJobMembership[]>;
    listMemberRolesForUser(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<TProjectMemberRoleLink[]>;
    listRolesByIds(params: TRepositoryClientParams<TClient> & TRoleIdsParams): Promise<TOrganizationRole[]>;
    listRolePermissionsByRoleIds(params: TRepositoryClientParams<TClient> & TRoleIdsParams): Promise<TProjectRolePermission[]>;
    listGroupIdsForUser(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<string[]>;
    listGroupsByIds(params: TRepositoryClientParams<TClient> & TGroupIdsParams): Promise<TOrganizationGroup[]>;
    listGroupRoleIds(params: TRepositoryClientParams<TClient> & TOrgParams & TGroupIdsParams): Promise<string[]>;
    listDirectPermissionGrants(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams & TGroupIdsParams): Promise<TProjectDirectPermissionGrant[]>;
}

export interface IProjectsService {
    createProject(params: TProjectCreateParams): Promise<TProject>;
    getProject(params: TProjectActorParams): Promise<TProject>;
    updateProject(params: TProjectUpdateParams): Promise<TProject>;
    listMembers(params: TProjectActorParams): Promise<TProjectMembership[]>;
    addMember(params: TProjectMemberCreateParams): Promise<TProjectMembership>;
    removeMember(params: TProjectMemberDeleteParams): Promise<TProjectMembership>;
    listJobs(params: TProjectActorParams): Promise<TJob[]>;
    getJob(params: TJobActorParams): Promise<TJob>;
    createJob(params: TJobCreateParams): Promise<TJob>;
    updateJob(params: TJobUpdateParams): Promise<TJob>;
    listJobMembers(params: TJobActorParams): Promise<TJobMembership[]>;
    listAccessibleProjectsForUserId(params: TProjectUserScopeParams): Promise<TProject[]>;
    listProjectMembershipsForUserId(params: TProjectUserScopeParams): Promise<TProjectMembership[]>;
    listJobMembershipsForUserId(params: TProjectJobUserScopeParams): Promise<TJobMembership[]>;
    listAccessibleJobsForUserId(params: TProjectJobUserScopeParams): Promise<TJob[]>;
}

export interface IProjectsContextService {
    listAccessibleProjectsForUserId(params: TProjectUserScopeParams): Promise<TProject[]>;
    listProjectMembershipsForUserId(params: TProjectUserScopeParams): Promise<TProjectMembership[]>;
    listJobMembershipsForUserId(params: TProjectJobUserScopeParams): Promise<TJobMembership[]>;
    listAccessibleJobsForUserId(params: TProjectJobUserScopeParams): Promise<TJob[]>;
}
