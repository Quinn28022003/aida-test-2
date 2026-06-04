export type TRepositoryClientParams<TClient> = {
    client: TClient;
};

export type TAuthUserParams = {
    authUserId: string;
};

export type TActorAuthUserParams = {
    actorAuthUserId: string;
};

export type TUserParams = {
    userId: string;
};

export type TOrgParams = {
    orgId: string;
};

export type TProjectParams = {
    projectId: string;
};

export type TJobParams = {
    jobId: string;
};

export type TMemberParams = {
    memberId: string;
};

export type TRoleIdsParams = {
    roleIds: readonly string[];
};

export type TGroupIdsParams = {
    groupIds: readonly string[];
};

export type TProjectIdsParams = {
    projectIds: readonly string[];
};

export type TJobIdsParams = {
    jobIds: readonly string[];
};

export type TOrgIdsParams = {
    orgIds: readonly string[];
};

export type TRowsParams<TRow> = {
    rows: TRow[];
};

export type TInputParams<TInput> = {
    input: TInput;
};
