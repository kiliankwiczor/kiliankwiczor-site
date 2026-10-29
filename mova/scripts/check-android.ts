import { distributionSettings } from '../apps/mobile/app.config.ts';

try {
  const settings = distributionSettings({ ...process.env, MOVA_DISTRIBUTION_BUILD: '1' });
  console.log(
    `Configuration Android cohérente : ${settings!.androidPackage}.\n` +
      'Ce contrôle ne compile rien et ne vérifie pas le serveur distant, la signature, les comptes ou les validations de lancement.\n' +
      'Voir docs/ANDROID_DISTRIBUTION.md avant toute compilation ou soumission.',
  );
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 1;
}
