import { clsx } from 'clsx';

// Thin wrapper around clsx so every component imports from one place.
// If we ever add tailwind-merge for conflict resolution, this is the
// only file that needs to change.
export const cn = (...inputs) => clsx(...inputs);
