import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, it, expect, vi } from 'vitest';

import {
  MultiSelectField,
  MultiRoleSelectorField,
  ControlledMultiSelect,
  ControlledMultiRoleSelector,
} from './MultiSelectField';

type FormData = { roles: string[] };

type HTMLElementWithRadixShims = HTMLElement & {
  hasPointerCapture?: (pointerId: number) => boolean;
  scrollIntoView?: (options?: ScrollIntoViewOptions) => void;
};

const elementPrototype = HTMLElement.prototype as HTMLElementWithRadixShims;

// JSDOM in Vitest may not implement pointer capture APIs used by Radix. Provide a safe shim for tests.
if (!elementPrototype.hasPointerCapture) {
  elementPrototype.hasPointerCapture = function () {
    return false;
  };
}

// Provide a no-op scrollIntoView for JSDOM so Radix's positioning logic doesn't throw in tests.
if (!elementPrototype.scrollIntoView) {
  elementPrototype.scrollIntoView = function () {};
}

const mockOptions = [
  { key: 'admin', label: 'Admin', description: 'Administrator role' },
  { key: 'editor', label: 'Editor', description: 'Editor role' },
  { key: 'viewer', label: 'Viewer' },
];

describe('MultiSelectField', () => {
  it('renders label and placeholder', () => {
    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: [] } });
      return (
        <FormProvider {...methods}>
          <MultiSelectField
            control={methods.control}
            name="roles"
            label="User Roles"
            placeholder="Select roles..."
            options={mockOptions}
          />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    expect(screen.getByText('User Roles')).toBeInTheDocument();
    expect(screen.getByText('Select roles...')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: [] } });
      return (
        <FormProvider {...methods}>
          <MultiSelectField
            control={methods.control}
            name="roles"
            label="Roles"
            description="Select one or more roles"
            options={mockOptions}
          />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    expect(screen.getByText('Select one or more roles')).toBeInTheDocument();
  });

  it('displays default values', () => {
    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: ['admin', 'editor'] } });
      return (
        <FormProvider {...methods}>
          <MultiSelectField control={methods.control} name="roles" label="Roles" options={mockOptions} />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    expect(screen.getByRole('combobox', { name: 'Admin, Editor' })).toBeInTheDocument();
  });

  it('opens dropdown and allows selecting options', async () => {
    const user = userEvent.setup();
    let formValues: FormData = { roles: [] };

    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: [] } });
      // Track form values
      formValues = methods.watch();
      return (
        <FormProvider {...methods}>
          <MultiSelectField control={methods.control} name="roles" label="Roles" options={mockOptions} />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    // Open dropdown
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Click on Admin option (find by role checkbox label pattern)
    const adminOption = await screen.findByText('Admin');
    await user.click(adminOption);

    // Verify form value was updated
    await waitFor(() => {
      expect(formValues.roles).toContain('admin');
    });
  });

  it('is disabled when disabled prop is true', () => {
    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: [] } });
      return (
        <FormProvider {...methods}>
          <MultiSelectField control={methods.control} name="roles" label="Roles" options={mockOptions} disabled />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('throws error when used without FormProvider or control', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<MultiSelectField name="roles" options={mockOptions} />);
    }).toThrow('MultiSelectField must be used within a FormProvider or with an explicit control prop');

    consoleSpy.mockRestore();
  });

  it('works with FormProvider context, passing control explicitly is optional', () => {
    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: ['viewer'] } });
      return (
        <FormProvider {...methods}>
          {/* Not passing control, relying on FormProvider context */}
          <MultiSelectField name="roles" label="Roles" options={mockOptions} />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    expect(screen.getByRole('combobox', { name: 'Viewer' })).toBeInTheDocument();
  });
});

describe('MultiRoleSelectorField (deprecated)', () => {
  it('works as a wrapper with old prop names', () => {
    function Wrapper() {
      const methods = useForm<FormData>({ defaultValues: { roles: ['admin'] } });
      return (
        <FormProvider {...methods}>
          <MultiRoleSelectorField control={methods.control} name="roles" label="Roles" roles={mockOptions} />
        </FormProvider>
      );
    }

    render(<Wrapper />);

    expect(screen.getByRole('combobox', { name: 'Admin' })).toBeInTheDocument();
  });
});

describe('ControlledMultiSelect', () => {
  it('renders with value and calls onChange when option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onBlur = vi.fn();

    render(
      <ControlledMultiSelect
        options={mockOptions}
        value={['admin']}
        onChange={onChange}
        onBlur={onBlur}
        placeholder="Select..."
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Admin' })).toBeInTheDocument();

    // Open dropdown
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Click on Editor option
    const editorOption = await screen.findByRole('checkbox', { name: /editor/i });
    await user.click(editorOption);

    expect(onChange).toHaveBeenCalledWith(['admin', 'editor']);
    expect(onBlur).toHaveBeenCalled();
  });

  it('handles null value gracefully', () => {
    const onChange = vi.fn();

    render(<ControlledMultiSelect options={mockOptions} value={null} onChange={onChange} placeholder="Select..." />);

    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('handles undefined value gracefully', () => {
    const onChange = vi.fn();

    render(
      <ControlledMultiSelect options={mockOptions} value={undefined} onChange={onChange} placeholder="Select..." />,
    );

    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('disables the selector when disabled prop is true', () => {
    const onChange = vi.fn();

    render(<ControlledMultiSelect options={mockOptions} value={[]} onChange={onChange} disabled />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});

describe('ControlledMultiRoleSelector (deprecated)', () => {
  it('works as a wrapper with old prop names', () => {
    const onChange = vi.fn();

    render(<ControlledMultiRoleSelector roles={mockOptions} value={['editor']} onChange={onChange} />);

    expect(screen.getByRole('combobox', { name: 'Editor' })).toBeInTheDocument();
  });
});
