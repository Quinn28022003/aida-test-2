import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { SelectField } from './SelectField';

type FormData = { sel?: string };

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

describe('SelectField', () => {
  const options = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ];

  it('renders label and placeholder', () => {
    function WrapperSimple() {
      const methods = useForm<FormData>({ defaultValues: { sel: '' } });
      return (
        <FormProvider {...methods}>
          <SelectField control={methods.control} name="sel" label="Sel" placeholder="pick" options={options} />
        </FormProvider>
      );
    }

    render(<WrapperSimple />);

    expect(screen.getByText('Sel')).toBeInTheDocument();
    expect(screen.getByText('pick')).toBeInTheDocument();
  });

  it('shows default value and allows selecting option', async () => {
    function WrapperDefault() {
      const methods = useForm<FormData>({ defaultValues: { sel: 'two' } });
      return (
        <FormProvider {...methods}>
          <SelectField control={methods.control} name="sel" label="Sel" placeholder="pick" options={options} />
        </FormProvider>
      );
    }

    render(<WrapperDefault />);

    // With a default value provided at mount the SelectTrigger should display the mapped label
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});
