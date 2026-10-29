import { test, expect } from '@playwright/test';
test('défi, conflit entre appareils, rechargement et remplacement réel du mouvement', async ({
  page,
  request,
}) => {
  const api = process.env.MOVA_E2E_API_URL ?? 'http://127.0.0.1:3001',
    email = `browser-${Date.now()}@example.invalid`,
    password = 'MotDePasseNavigateur42!';
  const registration = await request.post(api + '/auth/register', {
    data: { email, password, nickname: 'Testeuse fonctionnalités', adult: true, terms: true },
  });
  expect(registration.ok()).toBeTruthy();
  const token = (await registration.json()).token,
    headers = { Authorization: `Bearer ${token}` };
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'J’ai déjà un compte', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Mot de passe · 12 caractères minimum').fill(password);
    await page.getByRole('button', { name: 'Me connecter', exact: true }).click();
    for (let i = 0; i < 4; i++)
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    await page.getByRole('button', { name: 'Voir mon programme', exact: true }).click();
    await page.getByRole('button', { name: '← Mes entraînements', exact: true }).click();
    await page.getByRole('tab', { name: /Défis/ }).click();
    await page.getByRole('button', { name: 'Rejoindre ce défi', exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Quitter ce défi', exact: true })).toBeVisible();
    await page.getByRole('tab', { name: /Séances/ }).click();
    await page.getByRole('button', { name: 'Voir Renforcement express', exact: true }).click();
    await page
      .getByRole('button', { name: 'J’ai lu l’avertissement · démarrer', exact: true })
      .click();
    await page.getByRole('button', { name: 'Valider la série', exact: true }).first().click();
    await page.getByRole('button', { name: 'Synchroniser mes séries', exact: true }).click();
    await expect(
      page.getByText('Séries synchronisées avec le serveur.', { exact: true }),
    ).toBeVisible();
    const w = (await (await request.get(api + '/workouts', { headers })).json())[0];
    const sets = w.sets.map((s: { reps: number }) => ({ ...s, reps: 12 }));
    const remote = await request.put(api + `/workouts/${w.id}/sets`, {
      headers,
      data: { sets, baseRevision: w.revision },
    });
    expect(remote.ok()).toBeTruthy();
    await page.getByRole('button', { name: 'Synchroniser mes séries', exact: true }).click();
    await expect(
      page.getByRole('button', {
        name: 'Remplacer mon brouillon par la version serveur',
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Remplacer mon brouillon par la version serveur', exact: true })
      .click();
    await expect(page.getByLabel('Répétitions · série 1', { exact: true }).first()).toHaveValue(
      '12',
    );
    await page.getByRole('button', { name: /Remplacer par Squat au poids du corps/ }).click();
    await expect(page.getByText('TA SÉANCE · 0 / 6 SÉRIES', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Squat au poids du corps', exact: true }),
    ).toBeVisible();
    const fresh = await (await request.get(api + `/workouts/${w.id}`, { headers })).json();
    expect(fresh.snapshot.exerciseIds).toContain('squat');
    expect(fresh.snapshot.exerciseIds).not.toContain('chair');
    expect(fresh.sets).toHaveLength(0);
    await page.getByRole('button', { name: 'Pause et retour', exact: true }).click();
    await page.getByRole('tab', { name: /Communauté/ }).click();
    await page.getByRole('button', { name: 'Explorer les groupes', exact: true }).click();
    await page.getByRole('button', { name: 'Voir Les premiers pas', exact: true }).click();
    await page.getByRole('button', { name: 'Rejoindre le groupe', exact: true }).click();
    await page
      .getByLabel('Ta publication dans le groupe', { exact: true })
      .fill('Conversation de groupe créée pendant le test.');
    await page.getByRole('button', { name: 'Publier dans ce groupe', exact: true }).click();
    await expect(
      page.getByText('Conversation de groupe créée pendant le test.', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Ouvrir cette conversation de groupe', exact: true })
      .click();
    await page.getByRole('button', { name: 'Sauvegarder cette publication', exact: true }).click();
    await expect(page.getByText('Publication sauvegardée.', { exact: true })).toBeVisible();
  } finally {
    await request.delete(api + '/me', { headers, data: { password } });
  }
});
