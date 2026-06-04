import { render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ContextDocumentsTab } from './components/documentsTab';
import { ContextPanel } from './panel';
import { ContextServicesTab } from './components/servicesTab';
import { ContextTasksTab } from './components/tasksTab';
import { ContextToolsTab } from './components/toolsTab';
import { PanelShell } from '../panelLayout';

vi.mock('./hooks/context.hooks', () => ({
    useProjectTasks: () => ({
        tasks: [],
        isLoading: false,
        isError: false,
    }),
    useProjectDocuments: () => ({
        clientDocuments: [],
        knowledgeHubs: [],
        isLoading: false,
        isError: false,
    }),
    useProjectTools: () => ({
        tools: [],
        isLoading: false,
        isError: false,
    }),
    useProjectServices: () => ({
        service: null,
        isLoading: false,
        isError: false,
    }),
}));

function renderInShell(ui: ReactNode) {
    return render(<PanelShell>{ui}</PanelShell>);
}

describe('ContextPanel', () => {
    it('renders all context tabs in the panel header', () => {
        render(<ContextPanel projectId="proj-1" />);

        expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Tools' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Services' })).toBeInTheDocument();
    });

    it('shows tasks tab empty state by default when data has not loaded', () => {
        render(<ContextPanel projectId="proj-1" />);

        const tasksPanel = screen.getByRole('tabpanel');
        expect(within(tasksPanel).getByText('No tasks yet.')).toBeInTheDocument();
        expect(within(tasksPanel).getByRole('button', { name: 'Add task' })).toBeInTheDocument();
    });
});

describe('ContextTasksTab', () => {
    it('renders skeletons while loading', () => {
        const { container } = renderInShell(<ContextTasksTab tasks={[]} isLoading />);

        expect(container.querySelectorAll('.rounded-xl.border').length).toBeGreaterThanOrEqual(3);
        expect(screen.queryByText('Prepare income tax return')).not.toBeInTheDocument();
    });

    it('renders empty state and add task footer', () => {
        renderInShell(<ContextTasksTab tasks={[]} isLoading={false} />);

        expect(screen.getByText('No tasks yet.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add task' })).toBeInTheDocument();
    });

    it('renders task cards when data is provided', () => {
        renderInShell(
            <ContextTasksTab
                tasks={[
                    {
                        id: 'task-1',
                        title: 'Prepare income tax return',
                        dueLabel: 'Today, 5:00 PM',
                        progress: 80,
                        status: 'in_progress',
                    },
                ]}
                isLoading={false}
            />,
        );

        expect(screen.getByText('Prepare income tax return')).toBeInTheDocument();
        expect(screen.getByText('Due: Today, 5:00 PM')).toBeInTheDocument();
        expect(screen.getByRole('progressbar', { name: 'Prepare income tax return progress' })).toBeInTheDocument();
    });
});

describe('ContextDocumentsTab', () => {
    it('renders section headers and empty messages', () => {
        renderInShell(
            <ContextDocumentsTab clientDocuments={[]} knowledgeHubs={[]} isLoading={false} />,
        );

        expect(screen.getByText('Client documents')).toBeInTheDocument();
        expect(screen.getByText('Knowledge hubs')).toBeInTheDocument();
        expect(screen.getByText('No client documents yet.')).toBeInTheDocument();
        expect(screen.getByText('No knowledge hubs yet.')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'View all' }).length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Add document' })).toBeInTheDocument();
    });

    it('renders document cards when data is provided', () => {
        renderInShell(
            <ContextDocumentsTab
                clientDocuments={[
                    {
                        id: 'doc-1',
                        title: 'Tax_Returns_2024.pdf',
                        metadata: '2.4 MB • Uploaded 2h ago',
                    },
                ]}
                knowledgeHubs={[
                    {
                        id: 'hub-1',
                        title: 'Midelca Products and Services',
                        metadata: '1.2 MB • Oct 18',
                    },
                ]}
                isLoading={false}
            />,
        );

        expect(screen.getByText('Tax_Returns_2024.pdf')).toBeInTheDocument();
        expect(screen.getByText('Midelca Products and Services')).toBeInTheDocument();
    });
});

describe('ContextToolsTab', () => {
    it('renders empty state and add tool footer', () => {
        renderInShell(<ContextToolsTab tools={[]} isLoading={false} />);

        expect(screen.getByText('No tools yet.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add tool' })).toBeInTheDocument();
    });

    it('renders tool cards when data is provided', () => {
        renderInShell(
            <ContextToolsTab
                tools={[
                    {
                        id: 'tool-1',
                        title: 'Tax Return Form',
                        description: 'Fill forms with support with AI',
                        tone: 'blue',
                    },
                ]}
                isLoading={false}
            />,
        );

        expect(screen.getByText('Tax Return Form')).toBeInTheDocument();
    });
});

describe('ContextServicesTab', () => {
    it('renders empty state without add task footer', () => {
        renderInShell(<ContextServicesTab service={null} isLoading={false} />);

        expect(screen.getByText('No services yet.')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Send to friend' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add task' })).not.toBeInTheDocument();
    });

    it('renders services hero when data is provided', () => {
        renderInShell(
            <ContextServicesTab
                service={{
                    id: 'service-1',
                    logoLetter: 'M',
                    name: 'Midelca Services',
                    description:
                        'Streamlining architectural projects with smart automation, compliance tools, and expert support.',
                }}
                isLoading={false}
            />,
        );

        expect(screen.getByText('Midelca Services')).toBeInTheDocument();
        expect(
            screen.getByText(/Streamlining architectural projects with smart automation/),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send to friend' })).toBeInTheDocument();
    });
});
