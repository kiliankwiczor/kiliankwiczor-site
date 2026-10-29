import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useApi, type Catalog, type Workout } from '../../src/client';
import { Button, Card, Loading, Notice, Page, Txt } from '../../src/ui';
export default function Training() {
  const { request } = useApi(),
    router = useRouter(),
    q = useQuery({ queryKey: ['catalog'], queryFn: () => request<Catalog>('/catalog') }),
    h = useQuery({ queryKey: ['workouts'], queryFn: () => request<Workout[]>('/workouts') });
  if (q.isPending) return <Loading />;
  return (
    <Page>
      <Txt kind="label">BOUGER À TON RYTHME</Txt>
      <Txt kind="hero">Tes entraînements</Txt>
      <Button
        secondary
        label="Mon calendrier et mes statistiques"
        onPress={() => router.push('/personal')}
      />
      <Notice text={q.error?.message ?? h.error?.message} error />
      <Txt kind="title">Les programmes</Txt>
      {q.data?.programs.map((p) => (
        <Card key={p.id}>
          <Txt kind="small">
            {p.tier === 'free'
              ? 'DÉCOUVERTE GRATUITE'
              : p.tier.toUpperCase() + ' · ACHATS DÉSACTIVÉS'}{' '}
            · BROUILLON
          </Txt>
          <Txt kind="title">{p.name}</Txt>
          <Txt>
            {p.weeks} semaines · {p.days} jours / semaine · {p.minutes} min
          </Txt>
          <Button
            secondary
            label={`Voir ${p.name}`}
            onPress={() => router.push(`/program?id=${p.id}`)}
          />
        </Card>
      ))}
      <Txt kind="title">Comprendre les mouvements</Txt>
      {q.data?.exercises.map((e) => (
        <Button
          key={e.id}
          secondary
          label={e.name}
          onPress={() => router.push(`/exercise?id=${e.id}`)}
        />
      ))}
      <Txt kind="title">Ton historique</Txt>
      {h.data?.length === 0 && <Txt>Ta première séance t’attend. Rien à rattraper.</Txt>}
      {h.data?.map((w) => (
        <Card key={w.id}>
          <Txt>{w.snapshot.name}</Txt>
          <Txt kind="small">
            {new Date(w.started_at).toLocaleDateString('fr-FR')} ·{' '}
            {w.completed_at ? `${w.sets.length} séries enregistrées` : 'En cours'}
          </Txt>
          {!w.completed_at && (
            <Button label="Reprendre" onPress={() => router.push(`/session?id=${w.id}`)} />
          )}
        </Card>
      ))}
    </Page>
  );
}
