import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useApi, type Catalog } from '../src/client';
import { Button, Card, Loading, Notice, Page, Txt } from '../src/ui';
export default function Exercise() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { request } = useApi(),
    router = useRouter(),
    q = useQuery({ queryKey: ['catalog'], queryFn: () => request<Catalog>('/catalog') });
  if (q.isPending) return <Loading />;
  const e = q.data?.exercises.find((e) => e.id === id);
  return (
    <Page>
      <Button secondary label="← Retour" onPress={() => router.back()} />
      {!e ? (
        <Notice error text={q.error?.message ?? 'Exercice introuvable.'} />
      ) : (
        <>
          <Txt kind="label">MOUVEMENT · À VALIDER</Txt>
          <Txt kind="hero">{e.name}</Txt>
          <Txt>
            {e.muscle} · {e.equipment}
          </Txt>
          <Card>
            {e.instructions.map((text, i) => (
              <Txt key={text}>
                {i + 1}. {text}
              </Txt>
            ))}
          </Card>
          <Notice text={e.safety} />
          <Txt kind="title">À surveiller</Txt>
          <Txt>{e.mistakes}</Txt>
          <Txt kind="small">Aucune vidéo autorisée disponible dans le pilote.</Txt>
          <Button
            secondary
            label="Consulter une alternative"
            onPress={() => router.replace(`/exercise?id=${e.alternativeId}`)}
          />
        </>
      )}
    </Page>
  );
}
