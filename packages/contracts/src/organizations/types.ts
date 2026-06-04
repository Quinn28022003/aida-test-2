import type {
    DatabaseGenerated,
    GroupsRow,
    MemberRolesRow,
    OrganizationMembersUpdate,
    OrganizationMembersRow,
    OrganizationsInsert,
    OrganizationsRow,
    OrganizationsUpdate,
    RolePermissionsRow,
    RolesRow,
    SubjectPermissionGrantsRow,
    TablesInsert,
    TablesUpdate,
} from '@aida/db';
import type {
    TActorAuthUserParams,
    TInputParams,
    TMemberParams,
    TOrgParams,
    TUserParams,
} from '../params.types';

type TDatabaseEnums = DatabaseGenerated['public']['Enums'];

export type TOrganizationMemberStatus = TDatabaseEnums['member_status'];

export type TOrganizationMemberType = TDatabaseEnums['member_type'];

export type TOrganizationsRepositoryClient = unknown;

export type TOrganization = OrganizationsRow;

export type TOrganizationMembership = OrganizationMembersRow;

export type TOrganizationGroup = GroupsRow;

export type TOrganizationRole = RolesRow;

export type TOrganizationCreateInput = Pick<OrganizationsInsert, 'dataRegion' | 'defaultLocale' | 'name' | 'slug'>;

export type TOrganizationUpdateInput = Pick<OrganizationsUpdate, 'dataRegion' | 'defaultLocale' | 'name' | 'slug'>;

export type TOrganizationActorParams = TOrgParams & TActorAuthUserParams;

export type TOrganizationUpdateParams = TOrganizationActorParams & TInputParams<TOrganizationUpdateInput>;

export type TOrganizationMemberUpdateInput = Pick<OrganizationMembersUpdate, 'memberType' | 'status'> & {
    roleKeys?: string[];
};

export type TOrganizationCreateParams = TActorAuthUserParams & TInputParams<TOrganizationCreateInput>;

export type TOrganizationUserParams = TUserParams;

export type TOrganizationMemberActorParams = TOrgParams & TMemberParams & TActorAuthUserParams;

export type TOrganizationMemberUpdateParams = TOrganizationMemberActorParams & {
    input: TOrganizationMemberUpdateInput;
};

export type TOrganizationMemberRole = MemberRolesRow;

export type TOrganizationRolePermission = RolePermissionsRow;

export type TOrganizationDirectPermissionGrant = SubjectPermissionGrantsRow;

export type TOrganizationsRepositoryOrganizationInsert = TablesInsert<'organizations'>;

export type TOrganizationsRepositoryOrganizationUpdate = Pick<
    TablesUpdate<'organizations'>,
    'data_region' | 'default_locale' | 'name' | 'slug'
>;

export type TOrganizationsRepositoryCreateOrganizationInput = Pick<
    OrganizationsInsert,
    'createdBy' | 'dataRegion' | 'defaultLocale' | 'name' | 'slug'
>;

export type TOrganizationsRepositoryBootstrapOrganizationInput = Pick<
    OrganizationsInsert,
    'dataRegion' | 'defaultLocale' | 'name' | 'slug'
>;

export type TOrganizationsRepositoryUpdateOrganizationInput = Pick<
    OrganizationsUpdate,
    'dataRegion' | 'defaultLocale' | 'name' | 'slug'
>;

export type TOrganizationsRepositoryOrganizationMemberInsert = TablesInsert<'organization_members'>;

export type TOrganizationsRepositoryRoleInsert = TablesInsert<'roles'>;

export type TOrganizationsRepositoryRolePermissionInsert = TablesInsert<'role_permissions'>;

export type TOrganizationsRepositoryMemberRoleInsert = TablesInsert<'member_roles'>;

export type TOrganizationsRepositoryRoleKeyParams = {
    roleKey: string;
};
