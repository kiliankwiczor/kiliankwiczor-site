import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useApi, type Me, type Workout } from '../../src/client';
import { Button, Card, Loading, Notice, Page, Row, Txt } from '../../src/ui';
import { recommend } from '@mova/domain';
export default function Home() {
  const { request } = useApi(),
    router = useRouter();
  const me = useQuery({ queryKey: ['me'], queryFn: () => request<Me>('/me') });
  const workouts = useQuery({
    queryKey: ['workouts'],
    queryFn: () => request<Workout[]>('/workouts'),
  });
  if (me.isPending) return <Loading />;
  if (me.error)
    return (
      <Page>
        <Notice error text={me.error.message} />
        <Button label="Réessayer" onPress={() => me.refetch()} />
      </Page>
    );
  if (!me.data.preferences && me.isFetching) return <Loading />;
  if (!me.data.preferences) return <Redirect href="/onboarding" />;
  const done = workouts.data?.filter((w) => w.completed_at) ?? [],
    active = workouts.data?.find((w) => !w.completed_at);
  return (
    <Page>
      <Row>
        <Txt kind="title">mova ◒</Txt>
        <Txt kind="small">TON ESPACE, TON RYTHME</Txt>
      </Row>
      <Txt kind="hero">
        Bonjour,{'\n'}
        {me.data.profile.nickname}.
      </Txt>
      <Txt>Chaque séance est un pas pour toi. Les jours de repos comptent aussi.</Txt>
      <Card tint>
        <Txt kind="label" color="#E9E1F1">
          TA PROCHAINE ÉTAPE
        </Txt>
        <Txt kind="title" color="#FFF">
          {active
            ? 'On reprend là où tu en étais ?'
            : 'Un peu de mouvement. Beaucoup de confiance.'}
        </Txt>
        <Txt color="#F4EDF8">
          Un programme simple, des gestes à découvrir et le droit d’aller doucement.
        </Txt>
        <Button
          secondary
          label={active ? 'Reprendre ma séance' : 'Découvrir mon programme'}
          onPress={() =>
            router.push(
              active
                ? `/session?id=${active.id}`
                : `/program?id=${recommend(me.data.preferences!)}`,
            )
          }
        />
      </Card>
      <Row>
        <Card>
          <Txt kind="hero">{done.length}</Txt>
          <Txt>Séances terminées</Txt>
        </Card>
        <Card>
          <Txt kind="hero">{me.data.points}</Txt>
          <Txt>MOVA Points</Txt>
        </Card>
      </Row>
      <Notice text="Pilote : tous les exercices et programmes sont des brouillons à faire valider. Aucun contenu n’est présenté comme approuvé par une professionnelle." />
      <Txt kind="title">Une routine qui te ressemble</Txt>
      <Button
        secondary
        label="Explorer mes entraînements →"
        onPress={() => router.push('/training')}
      />
    </Page>
  );
}
