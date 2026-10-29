import { test } from 'node:test';
import assert from 'node:assert/strict';
import { programStep, challengeProgress, programs } from './index.js';
test('programme : nouvelle semaine après la fréquence prévue, charges jamais augmentées automatiquement', () => {
  const p = programs.find((p) => p.id === 'start')!;
  assert.equal(programStep(p, 0).week, 1);
  assert.equal(programStep(p, 2).week, 2);
  assert.equal(programStep(p, 2).reps, 9);
  assert.equal(programStep(p, 8).maintenance, true);
  assert.equal(programStep(p, 100).week, 4);
  assert.equal(programStep(p, 100).reps, 10);
});
test('défi : exclure le passé, le futur et les doubles séances du même jour', () => {
  const r = challengeProgress(
    '2026-10-05T12:00:00Z',
    1,
    2,
    [
      '2026-10-04T12:00:00Z',
      '2026-10-06T12:00:00Z',
      '2026-10-06T13:00:00Z',
      '2026-10-07T12:00:00Z',
      '2026-10-09T12:00:00Z',
    ],
    Date.parse('2026-10-08T12:00:00Z'),
  );
  assert.deepEqual(r.periods, [2]);
  assert.equal(r.complete, true);
});
test('défi : un jour civil ne contribue pas deux fois à la frontière des périodes', () => {
  const r = challengeProgress(
    '2026-10-05T12:00:00Z',
    2,
    2,
    ['2026-10-12T09:00:00Z', '2026-10-12T13:00:00Z'],
    Date.parse('2026-10-13T00:00:00Z'),
  );
  assert.deepEqual(r.periods, [1, 0]);
  assert.equal(r.complete, false);
});
test('défi : fin de période sans rattrapage ni perte de points', () => {
  const r = challengeProgress('2026-10-01T12:00:00Z', 1, 2, [], Date.parse('2026-10-09T12:00:00Z'));
  assert.equal(r.ended, true);
  assert.equal(r.complete, false);
  assert.deepEqual(r.periods, [0]);
});
