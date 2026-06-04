import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { TextareaField } from './TextareaField';

type FormData = { ta?: string };

describe('TextareaField', () => {
  const user = userEvent.setup();

  it('renders and updates value', async () => {
    function WrapperDefault() {
      const methods = useForm<FormData>({ defaultValues: { ta: '' } });
      return (
        <FormProvider {...methods}>
          <TextareaField control={methods.control} name="ta" label="TA" placeholder="enter" rows={3} />
        </FormProvider>
      );
    }

    render(<WrapperDefault />);

    const ta = screen.getByPlaceholderText('enter') as HTMLTextAreaElement;
    await user.type(ta, 'hello');
    expect(ta).toHaveValue('hello');
  });

  it('is disabled when prop set', () => {
    function WrapperDisabled() {
      const methods = useForm<FormData>({ defaultValues: { ta: 'x' } });
      return (
        <FormProvider {...methods}>
          <TextareaField control={methods.control} name="ta" label="TA" disabled />
        </FormProvider>
      );
    }

    render(<WrapperDisabled />);

    const ta = screen.getByLabelText('TA') as HTMLTextAreaElement;
    expect(ta).toBeDisabled();
  });
});
