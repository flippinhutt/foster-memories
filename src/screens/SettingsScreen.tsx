import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { AppText } from '@/src/components/AppText';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { getRepositories } from '@/src/db';

export function SettingsScreen() {
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    getRepositories()
      .then((repos) => setPersistent(repos.persistent))
      .catch(() => setPersistent(false));
  }, []);

  return (
    <Screen>
      <Card>
        <AppText variant="heading">Your data</AppText>
        {persistent ? (
          <AppText muted>
            Everything stays on this device. No account, no cloud, no tracking.
          </AppText>
        ) : (
          <AppText muted accessibilityRole="alert">
            Saving isn’t available here yet. Changes will be lost when you close this page.
          </AppText>
        )}
      </Card>
      <Card>
        <AppText variant="heading">Coming soon</AppText>
        <AppText muted>Theme settings. Export a pet’s story from its page.</AppText>
      </Card>
      <AppText variant="caption" muted>
        Version {Constants.expoConfig?.version ?? 'unknown'}
      </AppText>
    </Screen>
  );
}
