import { describe, expectTypeOf, it } from 'vitest';
import type { ModelRequest, ModelStreamEvent } from './model';

describe('model contracts', () => {
    it('exports serialisable model request contracts', () => {
        expectTypeOf<ModelRequest>().toMatchTypeOf<{
            profile: {
                provider: 'bedrock';
                model: string;
                region: string;
            };
            messages: Array<{
                role: 'system' | 'user' | 'assistant';
                content: string;
            }>;
        }>();
    });

    it('keeps stream events open for Mastra runtime mapping', () => {
        expectTypeOf<ModelStreamEvent>().toMatchTypeOf<
            | { type: 'delta'; delta: string }
            | { type: 'workflow_suspended'; workflowId: string; runId: string }
            | { type: 'background_task'; status: string; taskId: string }
            | { type: 'tool_progress'; toolName: string; status: string }
        >();
    });
});
