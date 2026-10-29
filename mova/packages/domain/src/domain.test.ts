import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccess,
  onboardingSchema,
  programs,
  recommend,
  validateCompletedSets,
} from './index.js';
test('onboarding refuse les valeurs hors limites et ne nécessite pas de poids', () => {
  assert.equal(
    onboardingSchema.safeParse({
      goal: 'routine',
      level: 'beginner',
      location: 'home',
      days: 2,
      minutes: 20,
    }).success,
    true,
  );
  assert.equal(
    onboardingSchema.safeParse({
      goal: 'routine',
      level: 'beginner',
      location: 'home',
      days: 7,
      minutes: 20,
    }).success,
    false,
  );
});
test('recommandation déterministe selon le lieu et la durée', () => {
  assert.equal(
    recommend({ goal: 'routine', level: 'beginner', location: 'gym', days: 2, minutes: 40 }),
    'first',
  );
});
test('un achat permanent survit à une expiration d’abonnement', () => {
  const p = programs.find((p) => p.id === 'strength')!;
  assert.equal(
    canAccess(
      '',
      [
        { kind: 'plus', program_id: null, expires_at: '2020-01-01' },
        { kind: 'purchase', program_id: p.id, expires_at: null },
      ],
      p,
    ),
    true,
  );
});
test('un abonnement expiré ou de niveau insuffisant ne donne pas accès', () => {
  const p = programs.find((p) => p.id === 'strength')!;
  assert.equal(
    canAccess('', [{ kind: 'plus', program_id: null, expires_at: '2099-01-01' }], p),
    false,
  );
  assert.equal(
    canAccess('', [{ kind: 'premium', program_id: null, expires_at: '2020-01-01' }], p),
    false,
  );
});
test('séries incomplètes ou dupliquées rejetées', () => {
  const p = programs.find((p) => p.id === 'first')!;
  const sets = p.exerciseIds.flatMap((exerciseId) =>
    [0, 1].map((index) => ({ exerciseId, index, reps: 8, weight: 0 })),
  );
  assert.equal(validateCompletedSets(p, sets), true);
  assert.equal(validateCompletedSets(p, [...sets.slice(1), sets[1]!]), false);
  assert.equal(validateCompletedSets(p, sets.slice(1)), false);
});
