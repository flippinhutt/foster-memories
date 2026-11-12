import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { emptyMemoryForm, type MemoryFormValues } from '@/src/services/memoryService';
import { pickPhotos } from '@/src/services/photoPicker';
import { MemoryForm } from '../MemoryForm';

jest.mock('@/src/services/photoPicker', () => ({ pickPhotos: jest.fn() }));
jest.mock('@/src/services/mediaFiles', () => ({ mediaUri: (path: string) => path }));

const pets = [
  { id: 'pet-1', name: 'Luna' },
  { id: 'pet-2', name: 'Milo' },
];
const initial: MemoryFormValues = { ...emptyMemoryForm, petId: 'pet-1', occurredAt: '03-20-2026' };

function renderForm(onSubmit = jest.fn(async () => undefined), values = initial) {
  return render(<MemoryForm pets={pets} initialValues={values} submitLabel="Save memory" onSubmit={onSubmit} />);
}

describe('MemoryForm', () => {
  it('asks for a photo or a note before saving', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await renderForm(onSubmit);

    await fireEvent.press(screen.getByRole('button', { name: 'Save memory' }));

    expect(await screen.findByText('Add a photo or a note.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a text memory with pet, mood, tags, and favorite', async () => {
    const onSubmit = jest.fn(async () => undefined);
    await renderForm(onSubmit);

    await fireEvent.press(screen.getByRole('radio', { name: 'Milo' }));
    await fireEvent.changeText(screen.getByLabelText('Note'), 'Slept in the sun');
    await fireEvent.press(screen.getByRole('radio', { name: 'Sweet' }));
    await fireEvent.changeText(screen.getByLabelText('Tags'), 'naps, sun');
    await fireEvent(screen.getByRole('switch', { name: 'Favorite' }), 'valueChange', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Save memory' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ petId: 'pet-2', body: 'Slept in the sun', mood: 'sweet', tags: 'naps, sun', isFavorite: true }),
      ),
    );
  });

  it('adds picked photos and lets the user remove one', async () => {
    jest.mocked(pickPhotos).mockResolvedValueOnce([
      { uri: 'content://1', mimeType: 'image/jpeg', width: 10, height: 10 },
      { uri: 'content://2', mimeType: 'image/jpeg', width: 10, height: 10 },
    ]);
    const onSubmit = jest.fn(async () => undefined);
    await renderForm(onSubmit);

    await fireEvent.press(screen.getByRole('button', { name: 'Add photos' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Remove photo 1' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save memory' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          photos: [{ kind: 'new', photo: expect.objectContaining({ uri: 'content://2' }) }],
        }),
      ),
    );
  });
});
