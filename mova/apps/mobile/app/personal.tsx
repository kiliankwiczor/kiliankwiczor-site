import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useApi, queryClient, type Stats } from '../src/client';
import { Button, Card, Loading, Notice, Page, Row, Txt } from '../src/ui';
export default function Personal() {
  const api = useApi(),
    router = useRouter(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.request<Stats>('/me/stats') });
  const badges = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.request<{ code: string; title: string; awarded_at: string }[]>('/me/badges'),
  });
  const blocks = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.request<{ blocked_id: string; nickname: string }[]>('/blocks'),
  });
  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api.request<{ id: string; body: string; nickname: string }[]>('/me/saved-posts'),
  });
  if (!api.token) return <Redirect href="/" />;
  if (stats.isPending) return <Loading />;
  async function unblock(id: string) {
    setBusy(true);
    setError('');
    try {
      await api.request(`/blocks/${id}`, undefined, 'DELETE');
      await queryClient.invalidateQueries();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Button secondary label="← Mon profil" onPress={() => router.replace('/profile')} />
      <Txt kind="hero">Tes étapes.</Txt>
      <Notice
        error
        text={
          error ||
          stats.error?.message ||
          badges.error?.message ||
          blocks.error?.message ||
          saved.error?.message
        }
      />
      <Row>
        <Card>
          <Txt kind="hero">{stats.data?.sessions ?? 0}</Txt>
          <Txt>Séances terminées</Txt>
        </Card>
        <Card>
          <Txt kind="hero">{stats.data?.sets ?? 0}</Txt>
          <Txt>Séries enregistrées</Txt>
        </Card>
      </Row>
      <Txt kind="title">Ton calendrier d’activité</Txt>
      <Txt kind="small">
        Jours de séances, heure de Paris. Les jours sans séance ne sont ni un échec ni une dette.
      </Txt>
      {stats.data?.calendar.length === 0 && (
        <Txt>Ton calendrier commencera avec ta première séance.</Txt>
      )}
      {stats.data?.calendar.map((d) => (
        <Card key={d.day}>
          <Txt>
            {new Date(d.day + 'T12:00:00Z').toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            · {d.sessions} séance(s)
          </Txt>
        </Card>
      ))}
      <Txt kind="title">Tes badges</Txt>
      {badges.data?.length === 0 && (
        <Txt>Aucun badge pour le moment. Pas de délai pour faire le premier pas.</Txt>
      )}
      {badges.data?.map((b) => (
        <Card key={b.code}>
          <Txt kind="title">◇ {b.title}</Txt>
          <Txt kind="small">Obtenu le {new Date(b.awarded_at).toLocaleDateString('fr-FR')}</Txt>
        </Card>
      ))}
      <Txt kind="title">Publications sauvegardées</Txt>
      {saved.data?.length === 0 && (
        <Txt>Retrouve ici les conversations que tu choisis de conserver.</Txt>
      )}
      {saved.data?.map((p) => (
        <Card key={p.id}>
          <Txt kind="label">{p.nickname}</Txt>
          <Txt>{p.body}</Txt>
          <Button
            secondary
            label="Ouvrir la conversation sauvegardée"
            onPress={() => router.push(`/post?id=${p.id}`)}
          />
        </Card>
      ))}
      <Txt kind="title">Membres bloquées</Txt>
      {blocks.data?.length === 0 && <Txt>Tu n’as bloqué personne.</Txt>}
      {blocks.data?.map((b) => (
        <Card key={b.blocked_id}>
          <Txt>{b.nickname}</Txt>
          <Button
            secondary
            busy={busy}
            label={`Débloquer ${b.nickname}`}
            onPress={() => unblock(b.blocked_id)}
          />
        </Card>
      ))}
    </Page>
  );
}
