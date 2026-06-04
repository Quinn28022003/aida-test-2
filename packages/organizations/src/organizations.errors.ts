import { createDomainErrorClass } from "@aida/contracts";

export const OrganizationNotFoundError = createDomainErrorClass<[orgId: string]>({
  name: "OrganizationNotFoundError",
  create: (orgId) => ({
    message: "Organisation not found",
    details: { orgId },
  }),
});

export const OrganizationAccessDeniedError = createDomainErrorClass<[message?: string]>({
  name: "OrganizationAccessDeniedError",
  create: (message = "Organisation access denied") => ({
    message,
  }),
});

export const OrganizationMemberNotFoundError = createDomainErrorClass<
  [orgId: string, memberId: string]
>({
  name: "OrganizationMemberNotFoundError",
  create: (orgId, memberId) => ({
    message: "Organisation member not found",
    details: { orgId, memberId },
  }),
});

export const OrganizationActorProfileNotFoundError = createDomainErrorClass<[authUserId: string]>({
  name: "OrganizationActorProfileNotFoundError",
  create: (authUserId) => ({
    message: "Actor profile not found",
    details: { authUserId },
  }),
});

export const OrganizationSystemRoleNotFoundError = createDomainErrorClass<[roleKey: string]>({
  name: "OrganizationSystemRoleNotFoundError",
  create: (roleKey) => ({
    message: "Organisation system role not found",
    details: { roleKey },
  }),
});
