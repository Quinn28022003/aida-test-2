import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

describe('Accordion Components', () => {
  describe('Accordion', () => {
    it('should render accordion root component', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Test Trigger</AccordionTrigger>
            <AccordionContent>Test Content</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('AccordionItem', () => {
    it('should render with default styles', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" data-testid="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
          </AccordionItem>
        </Accordion>,
      );

      const item = screen.getByTestId('item-1');
      expect(item).toBeInTheDocument();
      expect(item.tagName.toLowerCase()).toBe('details');
    });

    it('should apply custom className', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="custom-class" data-testid="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
          </AccordionItem>
        </Accordion>,
      );

      const item = screen.getByTestId('item-1');
      expect(item).toHaveClass('custom-class');
    });

    it('should forward props correctly', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" data-custom="test" data-testid="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
          </AccordionItem>
        </Accordion>,
      );

      const item = screen.getByTestId('item-1');
      expect(item).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('AccordionTrigger', () => {
    it('should render with default styles', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Click me</AccordionTrigger>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText('Click me').closest('summary');
      expect(trigger).toBeInTheDocument();
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger onClick={handleClick}>Test</AccordionTrigger>
          </AccordionItem>
        </Accordion>,
      );

      const trigger = screen.getByText('Test').closest('summary');
      if (trigger) fireEvent.click(trigger);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render children content', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <span data-testid="custom-trigger-content">Custom content</span>
            </AccordionTrigger>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByTestId('custom-trigger-content')).toBeInTheDocument();
    });
  });

  describe('AccordionContent', () => {
    it('should render with default styles', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent>Content here</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      expect(screen.getByText('Content here')).toBeInTheDocument();
    });

    it('should apply custom className to wrapper', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent className="custom-content">Content</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const contentWrapper = container.querySelector('.custom-content');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('should forward props correctly', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Test</AccordionTrigger>
            <AccordionContent data-custom="test" className="my-content">Content</AccordionContent>
          </AccordionItem>
        </Accordion>,
      );

      const contentNode = document.querySelector('.my-content');
      expect(contentNode?.parentElement).toHaveAttribute('data-custom', 'test');
    });
  });
});
