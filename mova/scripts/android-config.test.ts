import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distributionSettings } from '../apps/mobile/app.config.ts';

const configured = {
  MOVA_DISTRIBUTION_BUILD: '1',
  EXPO_PUBLIC_API_URL: 'https://api.expo.dev/mova-config-test',
  MOVA_EAS_PROJECT_ID: '12345678-1234-1234-1234-123456789abc',
  MOVA_ANDROID_PACKAGE: 'fr.mova.configtest',
};

test('distribution Android : le développement local reste possible sans comptes externes', () => {
  assert.equal(distributionSettings({}), null);
});
test('distribution Android : refuser une application qui pointerait sur le téléphone ou le LAN', () => {
  for (const endpoint of [
    undefined,
    '/api',
    'http://api.expo.dev',
    'https://localhost:3001',
    'https://127.0.0.1',
    'https://127.1',
    'https://[::1]',
    'https://[fd00::1]',
    'https://[::ffff:127.0.0.1]',
    'https://10.1.2.3',
    'https://192.168.1.8',
    'https://172.16.0.2',
    'https://169.254.169.254',
    'https://mova.local',
    'https://mova.invalid',
    'https://localhost.',
    'https://user:secret@api.expo.dev',
    'https://api.expo.dev/?token=secret',
    'https://api.expo.dev/#secret',
  ])
    assert.throws(
      () => distributionSettings({ ...configured, EXPO_PUBLIC_API_URL: endpoint }),
      /EXPO_PUBLIC_API_URL/,
    );
});
test('distribution Android : exiger le projet propriétaire et un identifiant non provisoire', () => {
  assert.throws(
    () => distributionSettings({ ...configured, MOVA_EAS_PROJECT_ID: '' }),
    /MOVA_EAS_PROJECT_ID/,
  );
  for (const androidPackage of ['', 'fr.mova.pilot', 'com.example.mova', 'Mova', 'fr.mova-app'])
    assert.throws(
      () => distributionSettings({ ...configured, MOVA_ANDROID_PACKAGE: androidPackage }),
      /MOVA_ANDROID_PACKAGE/,
    );
});
test('distribution Android : accepter une configuration distante explicite sans effectuer de requête', () => {
  assert.deepEqual(distributionSettings(configured), {
    apiUrl: configured.EXPO_PUBLIC_API_URL,
    projectId: configured.MOVA_EAS_PROJECT_ID,
    androidPackage: configured.MOVA_ANDROID_PACKAGE,
  });
});
