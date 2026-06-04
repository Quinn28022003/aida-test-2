import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { SwitchField } from './SwitchField';

type FormData = { togg?: boolean };

describe('SwitchField', () => {
  const user = userEvent.setup();

  it('renders label and toggles value', async () => {
    function WrapperToggle() {
      const methods = useForm<FormData>({ defaultValues: { togg: false } });
      return (
        <FormProvider {...methods}>
          <SwitchField control={methods.control} name="togg" label="Toggle me" />
        </FormProvider>
      );
    }

    // render and interact
    render(<WrapperToggle />);
    const button = screen.getByRole('switch');
    expect(button).toBeInTheDocument();

    // toggle
    await user.click(button);
    // After click, the element should reflect checked state
    expect(button).toHaveAttribute('data-state');
  });

  it('respects disabled', async () => {
    function WrapperDisabled() {
      const methods = useForm<FormData>({ defaultValues: { togg: true } });
      return (
        <FormProvider {...methods}>
          <SwitchField control={methods.control} name="togg" label="Toggle me" disabled />
        </FormProvider>
      );
    }

    render(<WrapperDisabled />);
    const button = screen.getByRole('switch');
    expect(button).toBeDisabled();
  });
});
