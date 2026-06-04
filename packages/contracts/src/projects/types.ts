import type {
    DatabaseGenerated,
    JobsInsert,
    JobMembersRow,
    JobsUpdate,
    JobsRow,
    Json,
    MemberRolesRow,
    ProjectMembersInsert,
    ProjectMembersRow,
    ProjectsInsert,
    ProjectsRow,
    ProjectsUpdate,
    RolePermissionsRow,
    SubjectPermissionGrantsRow,
    TablesInsert,
    TablesUpdate,
} from '@aida/db';
import type {
    TActorAuthUserParams,
    TInputParams,
    TJobParams,
    TOrgParams,
    TProjectParams,
    TUserParams,
} from '../params.types';
import type { TOrganizationGroup, TOrganizationMembership, TOrganizationRole } from '../organizations/types';

type TDatabaseEnums = DatabaseGenerated['public']['Enums'];

export type TJsonValue = Json;

export type TProjectMemberRole = TDatabaseEnums['project_member_role'];

export type TProjectStatus = TDatabaseEnums['project_status'];

export type TCustomerJobStatus = TDatabaseEnums['customer_job_status'];

export type TProjectsRepositoryClient = unknown;

export type TProject = ProjectsRow;

export type TProjectMembership = ProjectMembersRow;

export type TJob = JobsRow;

export type TJobMembership = JobMembersRow;

export type TProjectAuthorization = {
    groups: TOrganizationGroup[];
    jobMemberships: TJobMembership[];
    organizationMembership: TOrganizationMembership | null;
    permissions: string[];
    project: TProject;
    projectMembership: TProjectMembership | null;
    roles: TOrganizationRole[];
    actorProfileId: string;
};

export type TProjectCreateInput = Pick<ProjectsInsert, 'description' | 'key' | 'name'>;

export type TProjectUpdateInput = Pick<ProjectsUpdate, 'description' | 'key' | 'name' | 'status'>;

export type TProjectMemberCreateInput = Pick<ProjectMembersInsert, 'projectRole' | 'userId'>;

export type TProjectMemberDeleteInput = Pick<ProjectMembersInsert, 'userId'>;

export type TJobCreateInput = Pick<JobsInsert, 'customerProfileId' | 'externalRef' | 'metadata' | 'status' | 'title'>;

export type TJobUpdateInput = Pick<JobsUpdate, 'externalRef' | 'metadata' | 'status' | 'title'>;

export type TProjectCreateParams = TOrgParams & TActorAuthUserParams & TInputParams<TProjectCreateInput>;

export type TProjectActorParams = TProjectParams & TActorAuthUserParams;

export type TProjectUpdateParams = TProjectActorParams & {
    input: TProjectUpdateInput;
};

export type TProjectMemberCreateParams = TProjectActorParams & {
    input: TProjectMemberCreateInput;
};

export type TProjectMemberDeleteParams = TProjectActorParams & {
    input: TProjectMemberDeleteInput;
};

export type TJobActorParams = TProjectActorParams & TJobParams;

export type TJobCreateParams = TProjectActorParams & {
    input: TJobCreateInput;
};

export type TJobUpdateParams = TJobActorParams & {
    input: TJobUpdateInput;
};

export type TProjectUserScopeParams = TUserParams & {
    orgId?: string;
};

export type TProjectJobUserScopeParams = TUserParams & {
    projectId?: string;
};

export type TProjectsRepositoryProjectInsert = TablesInsert<'projects'>;

export type TProjectsRepositoryProjectUpdate = TablesUpdate<'projects'>;

export type TProjectsRepositoryProjectMemberInsert = TablesInsert<'project_members'>;

export type TProjectsRepositoryJobInsert = TablesInsert<'jobs'>;

export type TProjectsRepositoryJobUpdate = TablesUpdate<'jobs'>;

export type TProjectsRepositoryCreateProjectInput = Pick<
    ProjectsInsert,
    'createdBy' | 'description' | 'key' | 'name' | 'orgId'
>;

export type TProjectsRepositoryUpdateProjectInput = Pick<
    ProjectsUpdate,
    'description' | 'key' | 'name' | 'status'
>;

export type TProjectsRepositoryCreateProjectMemberInput = Pick<
    ProjectMembersInsert,
    'invitedBy' | 'orgId' | 'projectId' | 'projectRole' | 'userId'
>;

export type TProjectsRepositoryCreateJobInput = Pick<
    JobsInsert,
    'createdBy' | 'customerProfileId' | 'externalRef' | 'metadata' | 'orgId' | 'projectId' | 'status' | 'title'
>;

export type TProjectsRepositoryUpdateJobInput = Pick<
    JobsUpdate,
    'externalRef' | 'metadata' | 'status' | 'title'
>;

export type TProjectMemberRoleLink = MemberRolesRow;

export type TProjectRolePermission = RolePermissionsRow;

export type TProjectDirectPermissionGrant = SubjectPermissionGrantsRow;
