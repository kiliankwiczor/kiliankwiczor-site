import { useState } from 'react';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  useApi,
  queryClient,
  type Catalog,
  type Workout,
  type ProgramProgress,
} from '../src/client';
import { Button, Card, Loading, Notice, Page, Txt } from '../src/ui';
export default function Program() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    api = useApi(),
    router = useRouter(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    q = useQuery({ queryKey: ['catalog'], queryFn: () => api.request<Catalog>('/catalog') });
  const progress = useQuery({
    queryKey: ['program-progress', id],
    queryFn: () => api.request<ProgramProgress>(`/programs/${id}/progress`),
    enabled: !!api.token,
  });
  if (!api.token) return <Redirect href="/" />;
  if (q.isPending) return <Loading />;
  const p = q.data?.programs.find((p) => p.id === id);
  if (!p)
    return (
      <Page>
        <Notice error text={q.error?.message ?? 'Programme introuvable.'} />
      </Page>
    );
  async function start() {
    setBusy(true);
    try {
      const w = await api.request<Workout>('/workouts', { programId: id, acknowledgeDraft: true });
      await queryClient.invalidateQueries({ queryKey: ['workouts'] });
      router.replace(`/session?id=${w.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Button secondary label="← Mes entraînements" onPress={() => router.replace('/training')} />
      <Txt kind="label">PROGRAMME · {p.tier === 'free' ? 'GRATUIT' : p.tier.toUpperCase()}</Txt>
      <Txt kind="hero">{p.name}</Txt>
      <Txt>
        {p.weeks} semaines · {p.days} séances / semaine · environ {p.minutes} min
      </Txt>
      <Notice text="Contenu à valider par une professionnelle. La progression porte sur des repères de répétitions, sans augmentation automatique des charges. Interromps tout mouvement douloureux." />
      {progress.data && (
        <Card>
          <Txt kind="title">
            {progress.data.maintenance
              ? 'Cycle achevé · entretien'
              : `Semaine ${progress.data.week} / ${p.weeks}`}
          </Txt>
          <Txt>
            {Math.min(progress.data.completed, progress.data.total)} / {progress.data.total} séances
            de programme terminées.
          </Txt>
          <Txt>
            Prochain repère : {p.sets} séries de {progress.data.reps} répétitions, à adapter à ton
            confort.
          </Txt>
        </Card>
      )}
      <Notice error text={progress.error?.message} />
      {p.exerciseIds.map((id) => (
        <Card key={id}>
          <Txt kind="title">{q.data?.exercises.find((e) => e.id === id)?.name}</Txt>
          <Txt>
            {p.sets} séries · repère de {p.reps} répétitions · {p.rest} s de repos
          </Txt>
          <Button
            secondary
            label="Comprendre le mouvement"
            onPress={() => router.push(`/exercise?id=${id}`)}
          />
        </Card>
      ))}
      <Notice text={error} error />
      <Button
        busy={busy}
        label={
          p.tier === 'free'
            ? 'J’ai lu l’avertissement · démarrer'
            : 'Vérifier mon accès et démarrer'
        }
        onPress={start}
      />
      <Txt kind="small">
        Prévois un échauffement adapté et des jours de repos. Ce contenu général ne remplace pas un
        accompagnement professionnel.
      </Txt>
    </Page>
  );
}
