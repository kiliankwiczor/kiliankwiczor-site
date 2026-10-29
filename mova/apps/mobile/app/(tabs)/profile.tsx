import { useState } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useApi, queryClient, type Me } from '../../src/client';
import { Button, Card, Field, Loading, Notice, Page, Txt } from '../../src/ui';
export default function Profile() {
  const api = useApi(),
    router = useRouter(),
    q = useQuery({ queryKey: ['me'], queryFn: () => api.request<Me>('/me') }),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [exported, setExported] = useState(''),
    [busy, setBusy] = useState(false);
  if (q.isPending) return <Loading />;
  const me = q.data;
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Txt kind="hero">Ton espace.</Txt>
      <Notice error text={error || q.error?.message} />
      <Notice text={message} />
      {me && (
        <>
          <Card tint>
            <Txt kind="title" color="#FFF">
              {me.profile.nickname}
            </Txt>
            <Txt kind="hero" color="#FFF">
              {me.points} points
            </Txt>
            <Txt color="#FFF">Des étapes, pas une compétition.</Txt>
          </Card>
          <EditProfile
            initial={me}
            onSave={async (nickname, bio) => {
              await action(async () => {
                await api.request('/me/profile', { nickname, bio }, 'PATCH');
                await queryClient.invalidateQueries({ queryKey: ['me'] });
                setMessage('Profil enregistré.');
              });
            }}
          />
          <Button
            secondary
            label="Mes statistiques, badges et confidentialité"
            onPress={() => router.push('/personal')}
          />
          <Txt kind="title">Ton portefeuille</Txt>
          {me.ledger.length === 0 && (
            <Txt>Ta première séance peut te rapporter tes premiers points.</Txt>
          )}
          {me.ledger.map((l, i) => (
            <Card key={i}>
              <Txt>
                +{l.amount} · {l.reason}
              </Txt>
              <Txt kind="small">{new Date(l.created_at).toLocaleDateString('fr-FR')}</Txt>
            </Card>
          ))}
          <Button
            secondary
            label="Comprendre les offres"
            onPress={() => router.push('/subscriptions')}
          />
          {me.role === 'admin' && (
            <Button label="Administration Web" onPress={() => router.push('/admin')} />
          )}
        </>
      )}
      <Button
        secondary
        label="Exporter mes données"
        busy={busy}
        onPress={() =>
          action(async () => {
            const data = await api.request('/me/export');
            setExported(JSON.stringify(data, null, 2));
            setMessage(
              'Export généré. Il peut contenir tes données privées ; partage-le avec précaution.',
            );
          })
        }
      />
      {exported && (
        <Card>
          <Txt kind="small">{exported}</Txt>
          <Button
            secondary
            label="Partager cet export explicitement"
            onPress={() =>
              Share.share({ message: exported }).catch(() => setError('Partage indisponible.'))
            }
          />
        </Card>
      )}
      <Button
        secondary
        label="Confidentialité et conditions du pilote"
        onPress={() => router.push('/legal')}
      />
      <Button secondary label="Revoir mes préférences" onPress={() => router.push('/onboarding')} />
      <Button
        secondary
        busy={busy}
        label="Me déconnecter"
        onPress={() =>
          action(async () => {
            await api.request('/auth/logout', {});
            await api.signOut();
            router.replace('/');
          })
        }
      />
      <Card>
        <Txt kind="title">Supprimer mon compte de test</Txt>
        <Txt>
          Suppression immédiate des données actives et révocation de toutes les sessions. Cette
          action est irréversible.
        </Txt>
        <Field
          label="Mot de passe pour confirmer"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Field label="Écris SUPPRIMER" value={confirmation} onChangeText={setConfirmation} />
        <Button
          busy={busy}
          disabled={confirmation !== 'SUPPRIMER' || password.length < 12}
          label="Supprimer définitivement mon compte"
          onPress={() =>
            action(async () => {
              await api.request('/me', { password }, 'DELETE');
              await api.signOut();
              router.replace('/');
            })
          }
        />
      </Card>
    </Page>
  );
}
function EditProfile({
  initial,
  onSave,
}: {
  initial: Me;
  onSave: (name: string, bio: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial.profile.nickname),
    [bio, setBio] = useState(initial.profile.bio);
  return (
    <Card>
      <Field label="Pseudonyme public" value={name} onChangeText={setName} maxLength={40} />
      <Field
        label="Présentation publique · facultative"
        value={bio}
        onChangeText={setBio}
        maxLength={300}
        multiline
      />
      <Button
        secondary
        disabled={name.trim().length < 2}
        label="Enregistrer mon profil"
        onPress={() => onSave(name, bio)}
      />
    </Card>
  );
}
