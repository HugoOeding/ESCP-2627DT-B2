import { StatementError } from '../lib/statementParser';

/**
 * Where statement text comes from. "Use sample statement" fetches the bundled file from the same
 * origin (the only request the app makes); tests replace these functions with fixtures.
 */
export const statementSource = {
  loadSample: async (): Promise<string> => {
    const response = await fetch('./sample-statement.csv');
    if (!response.ok) throw new StatementError('unreadable');
    return response.text();
  },
  readFile: (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new StatementError('unreadable'));
      reader.readAsText(file);
    }),
};
