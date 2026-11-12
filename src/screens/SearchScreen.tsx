import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/AppText';
import { Button } from '@/src/components/Button';
import { MemoryCard } from '@/src/components/MemoryCard';
import { MilestoneCard } from '@/src/components/MilestoneCard';
import { OptionPicker } from '@/src/components/OptionPicker';
import { PetCard } from '@/src/components/PetCard';
import { Screen } from '@/src/components/Screen';
import { TextField } from '@/src/components/TextField';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { useMilestoneStore } from '@/src/stores/milestoneStore';
import { usePetStore } from '@/src/stores/petStore';
import { allTags, search } from '@/src/utils/search';
import { spacing } from '@/src/theme';

export function SearchScreen() {
  const router = useRouter();
  const pets = usePetStore((state) => state.pets);
  const { memories, tagsByMemory } = useMemoryStore();
  const milestones = useMilestoneStore((state) => state.milestones);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const tags = allTags(tagsByMemory);
  const results = search({ pets, memories, milestones, tagsByMemory }, { query, tag, favoritesOnly });
  const searching = query.trim() !== '' || tag !== '' || favoritesOnly;
  const total = results.pets.length + results.memories.length + results.milestones.length + results.tags.length;
  const openMemory = (id: string) => router.push({ pathname: '/memories/[id]', params: { id } });
  const openPet = (id: string) => router.push({ pathname: '/pets/[id]', params: { id } });

  return (
    <Screen>
      <TextField
        label="Search"
        placeholder="Pet name, tag, or phrase"
        value={query}
        onChangeText={setQuery}
        autoFocus
        returnKeyType="search"
      />
      <Button
        label={favoritesOnly ? '★ Favorites only' : 'Show favorites only'}
        variant="secondary"
        onPress={() => setFavoritesOnly((on) => !on)}
      />
      {tags.length > 0 ? (
        <OptionPicker
          label="Tag"
          options={[{ value: '', label: 'Any tag' }, ...tags.map((name) => ({ value: name, label: name }))]}
          value={tag}
          onChange={setTag}
        />
      ) : null}
      {!searching ? null : total === 0 ? (
        <AppText muted accessibilityLiveRegion="polite">
          No results. Try a pet name, tag, or phrase from a memory.
        </AppText>
      ) : (
        <>
          {results.pets.length > 0 ? (
            <View style={styles.group}>
              <AppText variant="heading">Pets</AppText>
              {results.pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} onPress={() => openPet(pet.id)} />
              ))}
            </View>
          ) : null}
          {results.tags.length > 0 ? (
            <View style={styles.group}>
              <AppText variant="heading">Tags</AppText>
              {results.tags.map((name) => (
                <Button
                  key={name}
                  label={`Show memories tagged ${name}`}
                  variant="secondary"
                  onPress={() => {
                    setTag(name);
                    setQuery('');
                  }}
                />
              ))}
            </View>
          ) : null}
          {results.memories.length > 0 ? (
            <View style={styles.group}>
              <AppText variant="heading">Memories</AppText>
              {results.memories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} onPress={() => openMemory(memory.id)} />
              ))}
            </View>
          ) : null}
          {results.milestones.length > 0 ? (
            <View style={styles.group}>
              <AppText variant="heading">Milestones</AppText>
              {results.milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onPress={() =>
                    milestone.memoryId ? openMemory(milestone.memoryId) : openPet(milestone.petId)
                  }
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
