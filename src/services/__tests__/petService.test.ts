import { createMemoryPetRepository } from '@/src/db/repositories/petRepository';
import { formFixture } from '@/test/fixtures';
import { createPet, petFormSchema, toPetFormValues, updatePet } from '../petService';

const errorsFor = (values: ReturnType<typeof formFixture>) => {
  const result = petFormSchema.safeParse(values);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe('petFormSchema', () => {
  it('only requires a name', () => {
    expect(errorsFor(formFixture())).toEqual({});
    expect(errorsFor(formFixture({ name: '   ' }))).toEqual({ name: 'Give your foster a name.' });
  });

  it('rejects invalid dates', () => {
    expect(errorsFor(formFixture({ arrivalDate: '02-30-2026' }))).toHaveProperty('arrivalDate');
    expect(errorsFor(formFixture({ arrivalDate: '2026-03-14' }))).toHaveProperty('arrivalDate');
  });

  it('rejects departure before arrival', () => {
    expect(errorsFor(formFixture({ arrivalDate: '03-14-2026', departureDate: '03-01-2026' }))).toEqual({
      departureDate: 'Departure can’t be before arrival.',
    });
  });
});

describe('createPet / updatePet', () => {
  const now = new Date('2026-03-14T12:00:00.000Z');

  it('creates a pet with a UUID, trimmed fields, and nulls for blanks', async () => {
    const repo = createMemoryPetRepository();
    const pet = await createPet(repo, formFixture({ name: '  Luna ', species: ' Cat ', breed: '  ' }), now);

    expect(pet.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(pet).toMatchObject({
      name: 'Luna',
      species: 'Cat',
      breed: null,
      sex: null,
      status: 'active',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    expect(await repo.getById(pet.id)).toEqual(pet);
  });

  it('updates fields and updatedAt but keeps id and createdAt', async () => {
    const repo = createMemoryPetRepository();
    const pet = await createPet(repo, formFixture(), now);
    const later = new Date('2026-04-01T09:00:00.000Z');

    const updated = await updatePet(
      repo,
      pet,
      { ...toPetFormValues(pet), status: 'adopted', departureDate: '04-01-2026' },
      later,
    );

    expect(updated).toMatchObject({
      id: pet.id,
      createdAt: pet.createdAt,
      updatedAt: later.toISOString(),
      status: 'adopted',
      departureDate: '2026-04-01',
    });
    expect(await repo.getById(pet.id)).toEqual(updated);
  });

  it('stores dates as ISO YYYY-MM-DD', async () => {
    const repo = createMemoryPetRepository();
    const pet = await createPet(repo, formFixture({ arrivalDate: '03-14-2026', departureDate: '12-01-2026' }), now);
    expect(pet).toMatchObject({ arrivalDate: '2026-03-14', departureDate: '2026-12-01' });
  });

  it('round-trips through form values', async () => {
    const repo = createMemoryPetRepository();
    const values = formFixture({ species: 'Dog', sex: 'male', arrivalDate: '01-02-2026', notes: 'Loves socks' });
    const pet = await createPet(repo, values, now);
    expect(toPetFormValues(pet)).toEqual(values);
  });
});
