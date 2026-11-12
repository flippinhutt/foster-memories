import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { emptyPetForm } from '@/src/services/petService';
import { PetForm } from '../PetForm';

describe('PetForm', () => {
  it('requires a name before saving', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await render(<PetForm initialValues={emptyPetForm} submitLabel="Save pet" onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save pet' }));

    expect(await screen.findByText('Give your foster a name.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits entered values', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await render(<PetForm initialValues={emptyPetForm} submitLabel="Save pet" onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText('Name *'), 'Luna');
    await fireEvent.press(screen.getByRole('radio', { name: 'Female' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save pet' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Luna', sex: 'female' })),
    );
  });

  it('shows a save error without losing input', async () => {
    const onSubmit = jest.fn(async () => {
      throw new Error('Database is locked');
    });
    await render(<PetForm initialValues={{ ...emptyPetForm, name: 'Luna' }} submitLabel="Save pet" onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save pet' }));

    expect(await screen.findByText('Database is locked')).toBeTruthy();
    expect(screen.getByDisplayValue('Luna')).toBeTruthy();
  });

  it('rejects a date that is not MM-DD-YYYY', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await render(<PetForm initialValues={{ ...emptyPetForm, name: 'Luna' }} submitLabel="Save pet" onSubmit={onSubmit} />);

    await fireEvent.changeText(screen.getByLabelText('Arrival date'), '2026-03-14');
    await fireEvent.press(screen.getByRole('button', { name: 'Save pet' }));

    expect(await screen.findByText('Use a date like 03-14-2026.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has a calendar button for each date', async () => {
    await render(<PetForm initialValues={emptyPetForm} submitLabel="Save pet" onSubmit={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Choose arrival date from calendar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Choose departure date from calendar' })).toBeTruthy();
  });
});
