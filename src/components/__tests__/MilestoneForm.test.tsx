import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { memoryFixture } from '@/test/fixtures';
import { emptyMilestoneForm, type MilestoneFormValues } from '@/src/services/milestoneService';
import { MilestoneForm } from '../MilestoneForm';

const initial: MilestoneFormValues = { ...emptyMilestoneForm, petId: 'pet-1', occurredAt: '03-20-2026' };
const memories = [{ ...memoryFixture({ title: 'Park day' }), photoPath: null, photoCount: 0 }];

describe('MilestoneForm', () => {
  it('asks for a name before saving', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await render(<MilestoneForm memories={[]} initialValues={initial} onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save milestone' }));

    expect(await screen.findByText('Name this milestone.')).toBeTruthy();
    expect(screen.queryByRole('radiogroup', { name: 'Linked memory' })).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fills the name from a suggestion and links a memory', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await render(<MilestoneForm memories={memories} initialValues={initial} onSubmit={onSubmit} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'First walk' }));
    expect(screen.getByLabelText('Milestone *').props.value).toBe('First walk');
    await fireEvent.press(screen.getByRole('radio', { name: 'Park day · 03-15-2026' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save milestone' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'First walk', memoryId: 'memory-1', occurredAt: '03-20-2026' }),
      ),
    );
  });
});
