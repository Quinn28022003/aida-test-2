import type { TProfile } from '../profiles/types';
import type {
    TAuthUserParams,
    TGroupIdsParams,
    TInputParams,
    TMemberParams,
    TOrgIdsParams,
    TOrgParams,
    TRepositoryClientParams,
    TRoleIdsParams,
    TRowsParams,
    TUserParams,
} from '../params.types';
import type {
    TOrganization,
    TOrganizationActorParams,
    TOrganizationCreateParams,
    TOrganizationDirectPermissionGrant,
    TOrganizationUpdateParams,
    TOrganizationGroup,
    TOrganizationMemberActorParams,
    TOrganizationMemberRole,
    TOrganizationMemberUpdateParams,
    TOrganizationMembership,
    TOrganizationRole,
    TOrganizationRolePermission,
    TOrganizationsRepositoryBootstrapOrganizationInput,
    TOrganizationsRepositoryCreateOrganizationInput,
    TOrganizationsRepositoryMemberRoleInsert,
    TOrganizationsRepositoryOrganizationMemberInsert,
    TOrganizationsRepositoryUpdateOrganizationInput,
    TOrganizationsRepositoryRoleInsert,
    TOrganizationsRepositoryRolePermissionInsert,
    TOrganizationsRepositoryRoleKeyParams,
    TOrganizationUserParams,
    TOrganizationsRepositoryClient,
} from './types';

export interface IOrganizationsRepository<TClient = TOrganizationsRepositoryClient> {
    getProfileByAuthUserId(params: TRepositoryClientParams<TClient> & TAuthUserParams): Promise<TProfile | null>;
    listOrganizationMembershipsByUserId(params: TRepositoryClientParams<TClient> & TUserParams): Promise<TOrganizationMembership[]>;
    getOrganizationMembershipByUserId(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<TOrganizationMembership | null>;
    getOrganizationMemberById(params: TRepositoryClientParams<TClient> & TOrgParams & TMemberParams): Promise<TOrganizationMembership | null>;
    listOrganizationsByIds(params: TRepositoryClientParams<TClient> & TOrgIdsParams): Promise<TOrganization[]>;
    getOrganizationById(params: TRepositoryClientParams<TClient> & TOrgParams): Promise<TOrganization | null>;
    createOrganization(params: TRepositoryClientParams<TClient> & TInputParams<TOrganizationsRepositoryCreateOrganizationInput>): Promise<TOrganization>;
    bootstrapOrganization(params: TRepositoryClientParams<TClient> & TInputParams<TOrganizationsRepositoryBootstrapOrganizationInput>): Promise<TOrganization>;
    updateOrganizationById(params: TRepositoryClientParams<TClient> & TOrgParams & TInputParams<TOrganizationsRepositoryUpdateOrganizationInput>): Promise<TOrganization>;
    deleteOrganizationById(params: TRepositoryClientParams<TClient> & TOrgParams): Promise<TOrganization | null>;
    createOrganizationMember(params: TRepositoryClientParams<TClient> & TInputParams<TOrganizationsRepositoryOrganizationMemberInsert>): Promise<TOrganizationMembership>;
    updateOrganizationMember(params: TRepositoryClientParams<TClient> & TOrgParams & TMemberParams & TInputParams<TOrganizationsRepositoryOrganizationMemberInsert | Record<string, unknown>>): Promise<TOrganizationMembership>;
    deleteOrganizationMember(params: TRepositoryClientParams<TClient> & TOrgParams & TMemberParams): Promise<TOrganizationMembership | null>;
    getSystemRoleByKey(params: TRepositoryClientParams<TClient> & TOrganizationsRepositoryRoleKeyParams): Promise<TOrganizationRole | null>;
    listRolesByOrgId(params: TRepositoryClientParams<TClient> & TOrgParams): Promise<TOrganizationRole[]>;
    insertRoles(params: TRepositoryClientParams<TClient> & TRowsParams<TOrganizationsRepositoryRoleInsert>): Promise<void>;
    listRolePermissionsByRoleIds(params: TRepositoryClientParams<TClient> & TRoleIdsParams): Promise<TOrganizationRolePermission[]>;
    upsertRolePermissions(params: TRepositoryClientParams<TClient> & TRowsParams<TOrganizationsRepositoryRolePermissionInsert>): Promise<void>;
    createMemberRole(params: TRepositoryClientParams<TClient> & TInputParams<TOrganizationsRepositoryMemberRoleInsert>): Promise<TOrganizationMemberRole>;
    listMemberRolesForUser(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<TOrganizationMemberRole[]>;
    deleteMemberRolesForUser(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<void>;
    listGroupIdsForUser(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams): Promise<string[]>;
    listGroupsByIds(params: TRepositoryClientParams<TClient> & TGroupIdsParams): Promise<TOrganizationGroup[]>;
    listGroupRoleIds(params: TRepositoryClientParams<TClient> & TOrgParams & TGroupIdsParams): Promise<string[]>;
    listRolesByIds(params: TRepositoryClientParams<TClient> & TRoleIdsParams): Promise<TOrganizationRole[]>;
    listDirectPermissionGrants(params: TRepositoryClientParams<TClient> & TOrgParams & TUserParams & TGroupIdsParams): Promise<TOrganizationDirectPermissionGrant[]>;
}

export interface IOrganizationsService {
    listMembershipsForUserId(params: TOrganizationUserParams): Promise<TOrganizationMembership[]>;
    listOrganizationsForUserId(params: TOrganizationUserParams): Promise<TOrganization[]>;
    createOrganization(params: TOrganizationCreateParams): Promise<TOrganization>;
    updateOrganization(params: TOrganizationUpdateParams): Promise<TOrganization>;
    deleteOrganization(params: TOrganizationActorParams): Promise<TOrganization>;
    getMember(params: TOrganizationMemberActorParams): Promise<TOrganizationMembership>;
    updateMember(params: TOrganizationMemberUpdateParams): Promise<TOrganizationMembership>;
    removeMember(params: TOrganizationMemberActorParams): Promise<TOrganizationMembership>;
}

export interface IOrganizationsContextService {
    listMembershipsForUserId(params: TOrganizationUserParams): Promise<TOrganizationMembership[]>;
    listOrganizationsForUserId(params: TOrganizationUserParams): Promise<TOrganization[]>;
}
