import { Screen } from '@/src/components/Screen';
import { EmptyState } from '@/src/components/StateViews';

export function CollectionsScreen() {
  return (
    <Screen scroll={false}>
      <EmptyState
        title="No collections yet"
        message="Soon you can create a collection such as ‘First Week’ or ‘Farewell.’"
      />
    </Screen>
  );
}
