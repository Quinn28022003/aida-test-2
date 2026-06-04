import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

describe('Tabs', () => {
  it('renders content of selected tab', () => {
    render(
      <Tabs value="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Tab One Content</TabsContent>
        <TabsContent value="two">Tab Two Content</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('Tab One Content')).toBeInTheDocument();
  });
});

