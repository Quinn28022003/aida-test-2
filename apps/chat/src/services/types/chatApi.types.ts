import type {
    AgentMembersRow,
    AgentsRow,
    ConversationMembersRow,
    ConversationsRow,
    JobMembersRow,
    JobsRow,
    OrganizationMembersRow,
    OrganizationsRow,
    ProjectMembersRow,
    ProjectsRow,
} from '@aida/db';

export type MeMemberships = {
    agents: AgentMembersRow[];
    conversations: ConversationMembersRow[];
    organizations: OrganizationMembersRow[];
    projects: ProjectMembersRow[];
    jobs: JobMembersRow[];
};

export type MeContext = {
    organizations: OrganizationsRow[];
    projects: ProjectsRow[];
    jobs: JobsRow[];
    agents: AgentsRow[];
    conversations: ConversationsRow[];
    memberships: MeMemberships;
};
