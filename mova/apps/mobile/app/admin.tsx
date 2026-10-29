import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useApi, queryClient, type Catalog, type Challenge } from '../src/client';
import { Button, Card, Field, Notice, Page, Row, Txt } from '../src/ui';
export default function Admin() {
  const { request } = useApi(),
    r = useRouter(),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    q = useQuery({
      queryKey: ['admin'],
      queryFn: () =>
        request<{
          counts: Record<string, number>;
          reports: { id: string; reason: string; post_id: string; body?: string }[];
        }>('/admin/overview'),
      retry: false,
    }),
    cat = useQuery({ queryKey: ['catalog'], queryFn: () => request<Catalog>('/catalog') }),
    challenges = useQuery({
      queryKey: ['challenges'],
      queryFn: () => request<Challenge[]>('/challenges'),
    });
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      setMessage('Action enregistrée dans le journal d’audit.');
      await queryClient.invalidateQueries();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Button secondary label="← Profil" onPress={() => r.replace('/profile')} />
      <Txt kind="hero">Atelier MOVA</Txt>
      <Notice error text={error || q.error?.message} />
      <Notice text={message} />
      {q.isPending && <Txt>Vérification des droits…</Txt>}
      {q.data && (
        <>
          <Notice text="Administration pilote : modération et édition du catalogue. Gestion des rôles, offres, récompenses et KPI de rétention non implémentée." />
          <Row>
            {Object.entries(q.data.counts).map(([key, value]) => (
              <Card key={key}>
                <Txt kind="title">{value}</Txt>
                <Txt>{key}</Txt>
              </Card>
            ))}
          </Row>
          <Txt kind="title">Signalements ouverts</Txt>
          {q.data.reports.length === 0 && <Txt>Aucun signalement ouvert.</Txt>}
          {q.data.reports.map((report) => (
            <Card key={report.id}>
              <Txt>{report.reason}</Txt>
              <Txt>{report.body ?? 'Publication supprimée'}</Txt>
              <Txt kind="small">Publication {report.post_id}</Txt>
              <Button
                busy={busy}
                label="Masquer la publication et résoudre"
                onPress={() =>
                  action(() => request(`/admin/reports/${report.id}/resolve`, { hide: true }))
                }
              />
              <Button
                busy={busy}
                secondary
                label="Résoudre sans masquer"
                onPress={() =>
                  action(() => request(`/admin/reports/${report.id}/resolve`, { hide: false }))
                }
              />
            </Card>
          ))}
          <GroupCreator
            busy={busy}
            onSave={(data) => action(() => request('/admin/groups', data))}
          />
          <ChallengeCreator
            busy={busy}
            onSave={(data) => action(() => request('/admin/challenges', data))}
          />
          {challenges.data?.map((c) => (
            <Card key={c.id}>
              <Txt kind="title">{c.title}</Txt>
              <Txt>
                {c.weeks} semaines · {c.weekly_goal} jours / période
              </Txt>
              <Button
                secondary
                busy={busy}
                label="Fermer les inscriptions et masquer ce défi"
                onPress={() =>
                  action(() => request(`/admin/challenges/${c.id}`, { active: false }, 'PATCH'))
                }
              />
            </Card>
          ))}
          <Txt kind="title">Catalogue · brouillons</Txt>
          {[...(cat.data?.exercises ?? []), ...(cat.data?.programs ?? [])].map((item) => (
            <CatalogEditor
              key={item.id}
              item={item}
              busy={busy}
              onSave={(patch) => action(() => request(`/admin/catalog/${item.id}`, patch, 'PATCH'))}
            />
          ))}
        </>
      )}
    </Page>
  );
}
function CatalogEditor({
  item,
  busy,
  onSave,
}: {
  item: {
    id: string;
    name: string;
    instructions?: string[];
    safety?: string;
    sets?: number;
    reps?: number;
    rest?: number;
  };
  busy: boolean;
  onSave: (patch: {
    name: string;
    instructions?: string[];
    safety?: string;
    sets?: number;
    reps?: number;
    rest?: number;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(item.name),
    [instructions, setInstructions] = useState(item.instructions?.join('\n') ?? ''),
    [safety, setSafety] = useState(item.safety ?? ''),
    [sets, setSets] = useState(String(item.sets ?? 2)),
    [reps, setReps] = useState(String(item.reps ?? 8)),
    [rest, setRest] = useState(String(item.rest ?? 60));
  return (
    <Card>
      <Txt kind="small">{item.id} · EN ATTENTE DE VALIDATION</Txt>
      <Field label={`Nom de ${item.id}`} value={name} onChangeText={setName} />
      {item.instructions ? (
        <>
          <Field
            label="Consignes · une par ligne"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
          <Field label="Consigne de sécurité" value={safety} onChangeText={setSafety} multiline />
        </>
      ) : (
        <>
          <Field
            label="Séries · 1 à 4"
            value={sets}
            onChangeText={setSets}
            keyboardType="number-pad"
          />
          <Field
            label="Répétitions de départ · 3 à 20"
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
          />
          <Field
            label="Repos en secondes · 30 à 180"
            value={rest}
            onChangeText={setRest}
            keyboardType="number-pad"
          />
        </>
      )}
      <Button
        busy={busy}
        secondary
        label="Enregistrer le contenu brouillon"
        onPress={() =>
          onSave(
            item.instructions
              ? {
                  name,
                  instructions: instructions
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  safety,
                }
              : { name, sets: Number(sets), reps: Number(reps), rest: Number(rest) },
          )
        }
      />
    </Card>
  );
}

function ChallengeCreator({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (data: {
    title: string;
    description: string;
    weeks: number;
    weeklyGoal: number;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(''),
    [description, setDescription] = useState(''),
    [weeks, setWeeks] = useState('4'),
    [goal, setGoal] = useState('2');
  return (
    <Card>
      <Txt kind="title">Créer un défi de régularité</Txt>
      <Field label="Titre du défi" value={title} onChangeText={setTitle} />
      <Field
        label="Description du défi"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Field
        label="Nombre de semaines · 1 à 8"
        value={weeks}
        onChangeText={setWeeks}
        keyboardType="number-pad"
      />
      <Field
        label="Objectif hebdomadaire · 1 à 3 jours"
        value={goal}
        onChangeText={setGoal}
        keyboardType="number-pad"
      />
      <Button
        busy={busy}
        disabled={title.trim().length < 3}
        label="Créer le défi"
        onPress={() =>
          onSave({ title, description, weeks: Number(weeks), weeklyGoal: Number(goal) })
        }
      />
    </Card>
  );
}

function GroupCreator({
  busy,
  onSave,
}: {
  busy: boolean;
  onSave: (data: { name: string; description: string }) => Promise<void>;
}) {
  const [name, setName] = useState(''),
    [description, setDescription] = useState('');
  return (
    <Card>
      <Txt kind="title">Créer un groupe thématique</Txt>
      <Field label="Nom du groupe" value={name} onChangeText={setName} />
      <Field
        label="Description du groupe"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Button
        busy={busy}
        disabled={name.trim().length < 3}
        label="Créer le groupe"
        onPress={() => onSave({ name, description })}
      />
    </Card>
  );
}
