import { describe, expect, it, vi } from 'vitest';

import { SupabaseAgentsRepository } from './repositories';
import type { AgentsSupabaseClient } from './agents.types';

describe('SupabaseAgentsRepository', () => {
  it('lists project agents with nested agent and active version rows', async () => {
    const projectId = '11111111-1111-4111-8111-111111111111';
    const agentId = '22222222-2222-4222-8222-222222222222';
    const versionId = '33333333-3333-4333-8333-333333333333';
    const linkId = '44444444-4444-4444-8444-444444444444';
    const orgId = '55555555-5555-4555-8555-555555555555';
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: linkId,
            org_id: orgId,
            project_id: projectId,
            agent_id: agentId,
            visibility: 'restricted',
            created_at: '2026-01-01T00:00:00Z',
            agents: {
              id: agentId,
              org_id: orgId,
              key: 'alpha-assistant',
              name: 'Alpha Assistant',
              description: null,
              status: 'active',
              active_version_id: versionId,
              created_by: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              active_version: {
                id: versionId,
                org_id: orgId,
                agent_id: agentId,
                version: 1,
                status: 'active',
                instructions: 'You are Alpha Assistant.',
                model_provider: 'bedrock',
                model_name: 'test-model',
                model_profile: 'balanced',
                temperature: 0.2,
                max_output_tokens: 2048,
                response_policy: {},
                memory_policy: {},
                rag_policy: {},
                tool_policy: {},
                created_by: null,
                created_at: '2026-01-01T00:00:00Z',
              },
            },
          },
        ],
        error: null,
      }),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    const repository = new SupabaseAgentsRepository();

    const result = await repository.listProjectAgents({
      client: supabase as unknown as AgentsSupabaseClient,
      projectId,
    });

    expect(supabase.from).toHaveBeenCalledWith('project_agents');
    expect(query.eq).toHaveBeenCalledWith('project_id', projectId);
    expect(result).toHaveLength(1);
    expect(result[0]?.projectAgent.id).toBe(linkId);
    expect(result[0]?.agent.id).toBe(agentId);
    expect(result[0]?.activeVersion?.id).toBe(versionId);
  });

  it('returns an empty list when no project agents exist', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    const repository = new SupabaseAgentsRepository();

    const result = await repository.listProjectAgents({
      client: supabase as unknown as AgentsSupabaseClient,
      projectId: '11111111-1111-4111-8111-111111111111',
    });

    expect(result).toEqual([]);
  });

  it('gets an agent detail row with project links and active version', async () => {
    const agentId = '22222222-2222-4222-8222-222222222222';
    const versionId = '33333333-3333-4333-8333-333333333333';
    const orgId = '55555555-5555-4555-8555-555555555555';
    const projectId = '11111111-1111-4111-8111-111111111111';
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: agentId,
          org_id: orgId,
          key: 'alpha-assistant',
          name: 'Alpha Assistant',
          description: null,
          status: 'active',
          active_version_id: versionId,
          created_by: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          active_version: {
            id: versionId,
            org_id: orgId,
            agent_id: agentId,
            version: 1,
            status: 'active',
            instructions: 'You are Alpha Assistant.',
            model_provider: 'bedrock',
            model_name: 'test-model',
            model_profile: 'balanced',
            temperature: 0.2,
            max_output_tokens: 2048,
            response_policy: {},
            memory_policy: {},
            rag_policy: {},
            tool_policy: {},
            created_by: null,
            created_at: '2026-01-01T00:00:00Z',
          },
          project_agents: [
            {
              id: '44444444-4444-4444-8444-444444444444',
              org_id: orgId,
              project_id: projectId,
              agent_id: agentId,
              visibility: 'restricted',
              created_at: '2026-01-01T00:00:00Z',
            },
          ],
        },
        error: null,
      }),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    const repository = new SupabaseAgentsRepository();

    const result = await repository.getAgentById({
      client: supabase as unknown as AgentsSupabaseClient,
      agentId,
    });

    expect(supabase.from).toHaveBeenCalledWith('agents');
    expect(query.eq).toHaveBeenCalledWith('id', agentId);
    expect(result?.agent.id).toBe(agentId);
    expect(result?.activeVersion?.id).toBe(versionId);
    expect(result?.projectLinks).toHaveLength(1);
  });

  it('returns null when the agent does not exist', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const supabase = {
      from: vi.fn(() => query),
    };
    const repository = new SupabaseAgentsRepository();

    const result = await repository.getAgentById({
      client: supabase as unknown as AgentsSupabaseClient,
      agentId: '22222222-2222-4222-8222-222222222222',
    });

    expect(result).toBeNull();
  });
});
