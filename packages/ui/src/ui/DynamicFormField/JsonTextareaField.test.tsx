import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { JsonTextareaField } from './JsonTextareaField';

type FormData = { jsonField?: object };

describe('JsonTextareaField', () => {
  const user = userEvent.setup();

  it('renders label and description', () => {
    function WrapperSimple() {
      const methods = useForm<FormData>({ defaultValues: { jsonField: undefined } });
      return (
        <FormProvider {...methods}>
          <JsonTextareaField
            control={methods.control}
            name="jsonField"
            label="JSON"
            placeholder="{}"
            description="help"
          />
        </FormProvider>
      );
    }

    render(<WrapperSimple />);

    // Component renders two labels with the same text (one label and one inside the toggle button).
    // Assert at least one exists and that the description is present.
    expect(screen.getAllByText('JSON').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('help')).toBeInTheDocument();
  });

  it('opens editor and shows default JSON value', async () => {
    const defaultValue = { a: 1 };

    function WrapperDefault() {
      const methods = useForm<FormData>({ defaultValues: { jsonField: defaultValue } });
      return (
        <FormProvider {...methods}>
          <JsonTextareaField control={methods.control} name="jsonField" label="JSON" />
        </FormProvider>
      );
    }

    render(<WrapperDefault />);

    // Toggle open
    const button = screen.getByRole('button');
    await user.click(button);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.value).toContain('"a": 1');

    // Change JSON to new object using fireEvent to input the raw JSON text
    fireEvent.change(textarea, { target: { value: '{"b":2}' } });

    // Note: parsing into form state happens inside component; here we assert textarea contents
    expect(textarea.value).toContain('"b"');
  });
});
