import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

/** These identifiers are public. Signing keys and server secrets never belong here. */
export function distributionSettings(env: Record<string, string | undefined>) {
  if (env.MOVA_DISTRIBUTION_BUILD !== '1') return null;
  const errors: string[] = [];
  const apiUrl = env.EXPO_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    errors.push('EXPO_PUBLIC_API_URL manque : fournir le serveur pilote HTTPS déployé.');
  } else {
    try {
      const url = new URL(apiUrl);
      const host = url.hostname
        .toLowerCase()
        .replace(/^\[|\]$/g, '')
        .replace(/\.$/, '');
      const local =
        /(^|\.)(localhost|local|internal|invalid|test|example)$/.test(host) ||
        ['0.0.0.0', '::', '::1', 'example.com', 'example.org', 'example.net'].includes(host) ||
        host.endsWith('.example.com') ||
        /^(0|10|127)\./.test(host) ||
        /^169\.254\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        (host.includes(':') && /^(fc|fd|fe80:)/.test(host)) ||
        host.startsWith('::ffff:');
      if (
        url.protocol !== 'https:' ||
        local ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        errors.push(
          'EXPO_PUBLIC_API_URL doit être une URL HTTPS distante, sans identifiants, paramètres ni fragment.',
        );
    } catch {
      errors.push('EXPO_PUBLIC_API_URL est une URL invalide.');
    }
  }
  const projectId = env.MOVA_EAS_PROJECT_ID?.trim();
  if (!projectId || !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(projectId))
    errors.push(
      'MOVA_EAS_PROJECT_ID manque ou est invalide : lier d’abord un projet au compte Expo du propriétaire.',
    );
  const androidPackage = env.MOVA_ANDROID_PACKAGE?.trim();
  if (
    !androidPackage ||
    !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(androidPackage) ||
    androidPackage === 'fr.mova.pilot' ||
    androidPackage.startsWith('com.example.')
  )
    errors.push(
      'MOVA_ANDROID_PACKAGE manque ou est provisoire : choisir l’identifiant Android définitif avant la première distribution.',
    );
  if (errors.length)
    throw new Error('Compilation Android distribuable bloquée :\n- ' + errors.join('\n- '));
  return { apiUrl: apiUrl!, projectId: projectId!, androidPackage: androidPackage! };
}

export default function configure({ config }: ConfigContext): ExpoConfig {
  const base: ExpoConfig = {
    ...config,
    name: config.name ?? appJson.expo.name,
    slug: config.slug ?? appJson.expo.slug,
  };
  const settings = distributionSettings(process.env);
  if (!settings) return base;
  return {
    ...base,
    android: { ...base.android, package: settings.androidPackage },
    extra: { ...base.extra, eas: { ...base.extra?.eas, projectId: settings.projectId } },
  };
}
