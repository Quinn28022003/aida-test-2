import { createDomainErrorClass } from "@aida/contracts";

export const ProjectNotFoundError = createDomainErrorClass<[projectId: string]>({
  name: "ProjectNotFoundError",
  create: (projectId) => ({
    message: "Project not found",
    details: { projectId },
  }),
});

export const ProjectMemberNotFoundError = createDomainErrorClass<
  [projectId: string, userId: string]
>({
  name: "ProjectMemberNotFoundError",
  create: (projectId, userId) => ({
    message: "Project member not found",
    details: { projectId, userId },
  }),
});

export const ProjectAccessDeniedError = createDomainErrorClass<[message?: string]>({
  name: "ProjectAccessDeniedError",
  create: (message = "Project access denied") => ({
    message,
  }),
});

export const JobNotFoundError = createDomainErrorClass<[jobId: string]>({
  name: "JobNotFoundError",
  create: (jobId) => ({
    message: "Job not found",
    details: { jobId },
  }),
});

export const JobAccessDeniedError = createDomainErrorClass<[message?: string]>({
  name: "JobAccessDeniedError",
  create: (message = "Job access denied") => ({
    message,
  }),
});

export const ProjectActorProfileNotFoundError = createDomainErrorClass<[authUserId: string]>({
  name: "ProjectActorProfileNotFoundError",
  create: (authUserId) => ({
    message: "Actor profile not found",
    details: { authUserId },
  }),
});
