import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('compte → onboarding → séance hors réseau/reprise → fin → publication → suppression', async ({
  page,
}) => {
  const email = `browser-${Date.now()}@example.invalid`,
    password = 'MotDePasseNavigateur42!';
  try {
    await page.goto('/');
    await page.getByLabel('Pseudonyme', { exact: true }).fill('Testeuse navigateur');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Mot de passe · 12 caractères minimum').fill(password);
    await page.getByRole('button', { name: /J’ai 18 ans/ }).click();
    await page.getByRole('button', { name: 'Créer mon compte', exact: true }).click();
    for (let i = 0; i < 4; i++)
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
    await page.getByRole('button', { name: 'Voir mon programme', exact: true }).click();
    await page
      .getByRole('button', { name: 'J’ai lu l’avertissement · démarrer', exact: true })
      .click();
    await expect(page.getByText('TA SÉANCE · 0 / 6 SÉRIES', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Valider la série', exact: true }).first().click();
    await page.route('**/workouts/**/sets', (route) => route.abort());
    await page.getByRole('button', { name: 'Synchroniser mes séries', exact: true }).click();
    await expect(page.getByText(/Connexion interrompue/)).toBeVisible();
    await page.getByRole('button', { name: 'Pause et retour', exact: true }).click();
    await page.getByRole('button', { name: 'Reprendre', exact: true }).click();
    await expect(page.getByText('TA SÉANCE · 1 / 6 SÉRIES', { exact: true })).toBeVisible();
    await page.unroute('**/workouts/**/sets');
    for (let i = 0; i < 5; i++)
      await page.getByRole('button', { name: 'Valider la série', exact: true }).first().click();
    await page.getByRole('button', { name: 'Synchroniser mes séries', exact: true }).click();
    await expect(
      page.getByText('Séries synchronisées avec le serveur.', { exact: true }),
    ).toBeVisible();
    // Server rejects instant completion; wait actual elapsed time rather than changing server time.
    await page.waitForTimeout(31000);
    await page.getByRole('button', { name: 'Terminer ma séance', exact: true }).click();
    await expect(page.getByText('Séance terminée', { exact: true })).toBeVisible();
    await expect(page.getByText('+50 points', { exact: true })).toBeVisible();
    const downloadReady = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Télécharger ma carte de réussite', exact: true })
      .click();
    const download = await downloadReady;
    const file = await download.path();
    if (!file) throw new Error('PNG non téléchargé');
    const png = await readFile(file);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(1080);
    expect(png.readUInt32BE(20)).toBe(1920);
    await download.saveAs(test.info().outputPath('mova-carte-test.png'));
    await page.getByRole('button', { name: 'Retrouver mon espace', exact: true }).click();
    await page.getByRole('tab', { name: /Communauté/ }).click();
    await page
      .getByLabel('Ta publication', { exact: true })
      .fill('Ma première séance de test est terminée.');
    await page.getByRole('button', { name: 'Publier dans la communauté', exact: true }).click();
    await expect(
      page.getByText('Ma première séance de test est terminée.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('tab', { name: /Profil/ }).click();
    await page.getByLabel('Mot de passe pour confirmer', { exact: true }).fill(password);
    await page.getByLabel('Écris SUPPRIMER', { exact: true }).fill('SUPPRIMER');
    await page
      .getByRole('button', { name: 'Supprimer définitivement mon compte', exact: true })
      .click();
    await expect(page.getByRole('button', { name: 'Créer mon compte', exact: true })).toBeVisible();
  } finally {
    const login = await page.request.post(
      `${process.env.MOVA_E2E_API_URL ?? 'http://127.0.0.1:3001'}/auth/login`,
      {
        data: { email, password },
      },
    );
    if (login.ok()) {
      const { token } = await login.json();
      await page.request.delete(`${process.env.MOVA_E2E_API_URL ?? 'http://127.0.0.1:3001'}/me`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password },
      });
    }
  }
});
