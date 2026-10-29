import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useApi } from '../src/client';
import { Button, Card, Field, Loading, Notice, Page, Row, Txt } from '../src/ui';
import { brand } from '@mova/domain';
export default function Welcome() {
  const api = useApi(),
    router = useRouter();
  const [mode, setMode] = useState<'register' | 'login' | 'forgot' | 'reset'>('register');
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [nickname, setNickname] = useState(''),
    [consent, setConsent] = useState(false),
    [reset, setReset] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  if (!api.ready) return <Loading />;
  if (api.token) return <Redirect href="/home" />;
  async function submit() {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const r = await api.request<{ message: string }>('/auth/forgot', { email });
        setMessage(r.message);
      } else if (mode === 'reset') {
        await api.request('/auth/reset', { token: reset, password });
        setMode('login');
        setMessage('Mot de passe modifié. Connecte-toi.');
      } else {
        const r = await api.request<{ token: string }>(`/auth/${mode}`, {
          email,
          password,
          ...(mode === 'register' ? { nickname, adult: consent, terms: consent } : {}),
        });
        await api.signIn(r.token);
        router.replace('/home');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Row>
        <Txt kind="title">
          mova
          <TextMark />
        </Txt>
        <Txt kind="small">PILOTE PRIVÉ · 18+</Txt>
      </Row>
      <Txt kind="hero">Plus forte.{'\n'}Ensemble.</Txt>
      <Txt>{brand.promise}</Txt>
      <Notice text="Version de développement. Utilise uniquement des données de test. Contenus sportifs en attente de validation professionnelle." />
      <Card>
        <Txt kind="title">
          {mode === 'register'
            ? 'Ton premier pas'
            : mode === 'login'
              ? 'Heureuse de te retrouver'
              : mode === 'forgot'
                ? 'Réinitialiser ton accès'
                : 'Un nouveau départ'}
        </Txt>
        {mode === 'register' && (
          <Field
            label="Pseudonyme"
            value={nickname}
            onChangeText={setNickname}
            autoComplete="nickname"
          />
        )}
        {mode !== 'reset' && (
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        )}
        {mode === 'reset' && (
          <Field
            label="Jeton du lien de réinitialisation"
            value={reset}
            onChangeText={setReset}
            autoCapitalize="none"
          />
        )}
        {mode !== 'forgot' && (
          <Field
            label="Mot de passe · 12 caractères minimum"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        )}
        {mode === 'register' && (
          <Button
            secondary
            label={`${consent ? '☑' : '☐'} J’ai 18 ans et j’accepte les conditions du pilote`}
            onPress={() => setConsent(!consent)}
          />
        )}
        <Notice text={error} error />
        <Notice text={message} />
        <Button
          busy={busy}
          label={
            mode === 'register'
              ? 'Créer mon compte'
              : mode === 'login'
                ? 'Me connecter'
                : mode === 'forgot'
                  ? 'Demander un lien'
                  : 'Enregistrer le mot de passe'
          }
          onPress={submit}
        />
        <Button
          secondary
          label={mode === 'register' ? 'J’ai déjà un compte' : 'Créer un compte'}
          onPress={() => {
            setMode(mode === 'register' ? 'login' : 'register');
            setError('');
          }}
        />
        <Button secondary label="Mot de passe oublié" onPress={() => setMode('forgot')} />
        {mode === 'forgot' && (
          <Button
            secondary
            label="J’ai un jeton de développement"
            onPress={() => setMode('reset')}
          />
        )}
        <Button
          secondary
          label="Lire les conditions du pilote"
          onPress={() => router.push('/legal')}
        />
      </Card>
      <Txt kind="small">
        Pas de poids demandé. Pas de promesse de transformation. Juste de la progression, à ton
        rythme.
      </Txt>
    </Page>
  );
}
function TextMark() {
  return ' ◒';
}
