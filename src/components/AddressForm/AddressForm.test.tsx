import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AddressForm } from './AddressForm';

describe('AddressForm', () => {
  it('shows validation when submitted empty', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<AddressForm onSubmit={handleSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole('button', { name: /find route/i }));

    expect(screen.getByText('Origin is required.')).toBeInTheDocument();
    expect(screen.getByText('Destination is required.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values when the form is valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<AddressForm onSubmit={handleSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText('Origin'), '  Innocentre, Hong Kong  ');
    await user.type(screen.getByLabelText('Destination'), 'Hong Kong International Airport Terminal 1');
    await user.click(screen.getByRole('button', { name: /find route/i }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      origin: 'Innocentre, Hong Kong',
      destination: 'Hong Kong International Airport Terminal 1',
    });
  });
});
