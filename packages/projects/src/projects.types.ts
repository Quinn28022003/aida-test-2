import type {
  IProjectsContextService,
  IProjectsRepository,
  IProjectsService,
  TProjectMemberRole,
} from "@aida/contracts";
import type {
  Database,
  GroupsRow,
  JobMembersRow,
  OrganizationMembersRow,
  ProjectMembersRow,
  ProjectsRow,
  RolesRow,
} from "@aida/db";
import type { AppAbility } from "@aida/permissions";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectsSupabaseClient = SupabaseClient<Database>;

export type ProjectsRepository = IProjectsRepository<ProjectsSupabaseClient>;

export type ProjectsService = IProjectsService;

export type ProjectsContextService = IProjectsContextService;

export type ProjectAuthorizationSnapshot = {
  ability: AppAbility;
  actorProfileId: string;
  groups: GroupsRow[];
  jobMemberships: JobMembersRow[];
  organizationMembership: OrganizationMembersRow | null;
  permissions: string[];
  project: ProjectsRow;
  projectMembership: ProjectMembersRow | null;
  roles: RolesRow[];
};

export type ProjectPermissionAction = "create" | "read" | "update" | "delete";

export type ProjectPermissionSubject = "project" | "project_member" | "job" | "job_member";

export type ProjectPermissionCheckParams = {
  action: ProjectPermissionAction;
  snapshot: Pick<ProjectAuthorizationSnapshot, "ability" | "organizationMembership">;
  subject: ProjectPermissionSubject;
};

export type ProjectManagerSnapshot = Pick<ProjectAuthorizationSnapshot, "projectMembership">;

export type ManagedProjectRole = Extract<TProjectMemberRole, "owner" | "admin">;
