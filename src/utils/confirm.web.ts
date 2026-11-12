/** Asks the user to confirm a destructive action. Resolves true only on confirm. */
export function confirmDestructive(title: string, message: string, _confirmLabel: string): Promise<boolean> {
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}
