import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi, queryClient, type Challenge } from '../../src/client';
import { Button, Card, Loading, Notice, Page, Txt } from '../../src/ui';
export default function Challenges() {
  const api = useApi(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    q = useQuery({
      queryKey: ['challenges'],
      queryFn: () => api.request<Challenge[]>('/challenges'),
    });
  async function join(c: Challenge) {
    setBusy(true);
    setError('');
    try {
      await api.request(
        `/challenges/${c.id}/join`,
        c.joined_at ? undefined : {},
        c.joined_at ? 'DELETE' : 'POST',
      );
      await queryClient.invalidateQueries({ queryKey: ['challenges'] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (q.isPending) return <Loading />;
  return (
    <Page>
      <Txt kind="label">LA RÉGULARITÉ, SANS PRESSION</Txt>
      <Txt kind="hero">Le plaisir d’avancer ensemble.</Txt>
      <Notice error text={error || q.error?.message} />
      <Txt>
        Un même rendez-vous, chacune à son rythme. Une seule journée est comptée par jour, même avec
        plusieurs séances. Aucun classement corporel.
      </Txt>
      {q.data?.length === 0 && <Txt>Aucun défi ouvert pour le moment.</Txt>}
      {q.data?.map((c) => (
        <Card key={c.id}>
          <Txt kind="title">{c.title}</Txt>
          <Txt>{c.description}</Txt>
          <Txt>
            {c.weeks} semaines · {c.weekly_goal} jours de séance par période de 7 jours
          </Txt>
          {c.progress && (
            <>
              <Txt kind="label">
                {c.progress.complete
                  ? 'DÉFI RÉUSSI'
                  : c.progress.ended
                    ? 'DÉFI TERMINÉ · CHAQUE ÉTAPE COMPTE'
                    : `PÉRIODE ${c.progress.currentPeriod} / ${c.weeks}`}
              </Txt>
              {c.progress.periods.map((n, i) => (
                <Txt key={i}>
                  Semaine {i + 1} : {n} / {c.weekly_goal} jours
                </Txt>
              ))}
              <Txt kind="small">
                La première période débute à ton inscription. Le repos ne retire aucun point.
                Quitter puis rejoindre redémarre ton calendrier.
              </Txt>
            </>
          )}
          <Button
            busy={busy}
            secondary={!!c.joined_at}
            label={c.joined_at ? 'Quitter ce défi' : 'Rejoindre ce défi'}
            onPress={() => join(c)}
          />
        </Card>
      ))}
      <Txt kind="small">
        Le défi attribue un badge de réussite, pas un bonus de points. Les invitations et équipes
        restent à intégrer.
      </Txt>
    </Page>
  );
}
