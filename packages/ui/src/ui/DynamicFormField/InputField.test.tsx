import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { InputField } from './InputField';

type FormData = { testField?: string | number };

function WrapperWithField({ defaultValues = {} }: { defaultValues?: Partial<FormData> }) {
  const methods = useForm<FormData>({ defaultValues: { testField: '', ...defaultValues } });
  return (
    <FormProvider {...methods}>
      <InputField control={methods.control} name="testField" label="Test Label" placeholder="Enter" />
    </FormProvider>
  );
}

describe('InputField', () => {
  const user = userEvent.setup();

  it('renders label and placeholder', () => {
    render(<WrapperWithField />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter')).toBeInTheDocument();
  });

  it('displays default value and updates on user input', async () => {
    function WrapperDefault() {
      const methods = useForm<FormData>({ defaultValues: { testField: 'hello' } });
      return (
        <FormProvider {...methods}>
          <InputField control={methods.control} name="testField" label="Test Label" placeholder="Enter" />
        </FormProvider>
      );
    }

    render(<WrapperDefault />);

    const input = screen.getByDisplayValue('hello');
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'world');
    expect(input).toHaveValue('world');
  });

  it('handles number input conversion', async () => {
    function WrapperNumber() {
      const methods = useForm<FormData>({ defaultValues: { testField: 5 } });
      return (
        <FormProvider {...methods}>
          <InputField control={methods.control} name="testField" label="Number" inputType="number" />
        </FormProvider>
      );
    }

    // Render wrapper and interact
    const { container } = render(<WrapperNumber />);
    const input = container.querySelector('input') as HTMLInputElement;

    // Use fireEvent.change to reliably set the numeric value
    fireEvent.change(input, { target: { value: '42' } });

    // UI should reflect the new numeric value
    expect(input.value).toBe('42');
  });

  it('renders required star and description and disabled state', () => {
    function WrapperReq() {
      const methods = useForm<FormData>({ defaultValues: { testField: '' } });
      return (
        <FormProvider {...methods}>
          <InputField
            control={methods.control}
            name="testField"
            label="Req"
            required
            description="help text"
            disabled
          />
        </FormProvider>
      );
    }

    render(<WrapperReq />);

    expect(screen.getByText('Req')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('help text')).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
});
