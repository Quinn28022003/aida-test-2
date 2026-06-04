import { createDomainErrorClass } from '@aida/contracts';

export const AgentNotFoundError = createDomainErrorClass<[agentId: string]>({
  name: 'AgentNotFoundError',
  create: (agentId) => ({
    message: 'Agent not found',
    details: { agentId },
  }),
});

export const AgentProjectNotFoundError = createDomainErrorClass<[projectId: string]>({
  name: 'ProjectNotFoundError',
  create: (projectId) => ({
    message: 'Project not found',
    details: { projectId },
  }),
});

export const AgentActorProfileNotFoundError = createDomainErrorClass<[authUserId: string]>({
  name: 'ProjectActorProfileNotFoundError',
  create: (authUserId) => ({
    message: 'Actor profile not found',
    details: { authUserId },
  }),
});

export const AgentVersionNotFoundError = createDomainErrorClass<[agentId: string, versionId: string]>({
  name: 'AgentVersionNotFoundError',
  create: (agentId, versionId) => ({
    message: 'Agent version not found',
    details: { agentId, versionId },
  }),
});

export const AgentMemberNotFoundError = createDomainErrorClass<[agentId: string, userId: string]>({
  name: 'AgentMemberNotFoundError',
  create: (agentId, userId) => ({
    message: 'Agent member not found',
    details: { agentId, userId },
  }),
});

export const AgentMemberAlreadyExistsError = createDomainErrorClass<[agentId: string, userId: string]>({
  name: 'AgentMemberAlreadyExistsError',
  create: (agentId, userId) => ({
    message: 'Agent member already exists',
    details: { agentId, userId },
  }),
});

export const AgentInvitationNotFoundError = createDomainErrorClass<[agentId: string, invitationId: string]>({
  name: 'AgentInvitationNotFoundError',
  create: (agentId, invitationId) => ({
    message: 'Agent invitation not found',
    details: { agentId, invitationId },
  }),
});
