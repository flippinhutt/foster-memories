import { useEffect, useState, type ReactNode } from 'react';
import { getRepositories } from '@/src/db';
import { useMemoryStore } from '@/src/stores/memoryStore';
import { usePetStore } from '@/src/stores/petStore';
import { ErrorState, LoadingState } from './StateViews';

type GateState = { status: 'opening' } | { status: 'ready' } | { status: 'error'; message: string };

/** Opens the database and runs migrations before showing the app. */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>({ status: 'opening' });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getRepositories()
      .then(() => {
        setState({ status: 'ready' });
        return Promise.all([usePetStore.getState().load(), useMemoryStore.getState().load()]);
      })
      .catch((error: unknown) =>
        setState({
          status: 'error',
          message: `We couldn’t open your memories. ${error instanceof Error ? error.message : ''}`.trim(),
        }),
      );
  }, [attempt]);

  const retry = () => {
    setState({ status: 'opening' });
    setAttempt((n) => n + 1);
  };

  if (state.status === 'opening') return <LoadingState label="Opening your memories" />;
  if (state.status === 'error') return <ErrorState message={state.message} onRetry={retry} />;
  return children;
}
