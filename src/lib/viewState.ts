export type ViewState = 'loading' | 'empty' | 'error' | 'stale' | 'retry' | 'disabled' | 'ready';

export interface ViewStateInput {
  isLoading?: boolean;
  isError?: boolean;
  isDisabled?: boolean;
  hasData?: boolean;
  ageSeconds?: number;
  staleAfterSeconds?: number;
}

export const deriveViewState = (input: ViewStateInput): ViewState => {
  if (input.isDisabled) return 'disabled';
  if (input.isError) return 'error';
  if (input.isLoading) return 'loading';
  if (!input.hasData) return 'empty';

  const staleAfter = input.staleAfterSeconds ?? 60;
  const age = input.ageSeconds ?? 0;
  if (age > staleAfter) return 'stale';

  return 'ready';
};

export const canRetry = (state: ViewState): boolean => state === 'error' || state === 'stale' || state === 'empty';
