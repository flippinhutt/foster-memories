import { useEffect, useRef } from 'react';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Ctrl+S or Ctrl+Enter (⌘ on Mac) calls `onSave` instead of the browser's own save. */
export function useSaveShortcut(onSave: () => void): void {
  const latest = useRef(onSave);
  useEffect(() => {
    latest.current = onSave;
  });

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!(isMac ? event.metaKey : event.ctrlKey)) return;
      if (event.key !== 's' && event.key !== 'Enter') return;
      event.preventDefault();
      latest.current();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
}

export const SAVE_SHORTCUT_HINT: string | null = isMac ? '⌘S to save' : 'Ctrl+S to save';
