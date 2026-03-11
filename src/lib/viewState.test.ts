import test from 'node:test';
import assert from 'node:assert/strict';
import { canRetry, deriveViewState } from './viewState';

test('deriveViewState: loading wins', () => {
  assert.equal(deriveViewState({ isLoading: true, hasData: false }), 'loading');
});

test('deriveViewState: error wins over loading=false', () => {
  assert.equal(deriveViewState({ isError: true }), 'error');
});

test('deriveViewState: empty when no data', () => {
  assert.equal(deriveViewState({ hasData: false }), 'empty');
});

test('deriveViewState: stale when age exceeds threshold', () => {
  assert.equal(deriveViewState({ hasData: true, ageSeconds: 90, staleAfterSeconds: 60 }), 'stale');
});

test('deriveViewState: disabled overrides all', () => {
  assert.equal(deriveViewState({ isDisabled: true, isError: true, isLoading: true }), 'disabled');
});

test('canRetry supports empty/error/stale', () => {
  assert.equal(canRetry('empty'), true);
  assert.equal(canRetry('error'), true);
  assert.equal(canRetry('stale'), true);
  assert.equal(canRetry('loading'), false);
});
