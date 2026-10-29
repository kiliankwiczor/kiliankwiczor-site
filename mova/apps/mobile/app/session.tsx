import { useEffect, useRef, useState } from 'react';
import { Share, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  useApi,
  queryClient,
  ApiError,
  type SetLog,
  type Workout,
  type Catalog,
  type Stats,
} from '../src/client';
import { Button, Card, Field, Loading, Notice, Page, Row, Txt } from '../src/ui';
import { supportsImageCard, downloadAchievementCard } from '../src/achievementCard';
export default function Session() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    api = useApi(),
    router = useRouter(),
    q = useQuery({ queryKey: ['workouts'], queryFn: () => api.request<Workout[]>('/workouts') }),
    cat = useQuery({ queryKey: ['catalog'], queryFn: () => api.request<Catalog>('/catalog') }),
    stats = useQuery({ queryKey: ['stats'], queryFn: () => api.request<Stats>('/me/stats') });
  if (!api.token) return <Redirect href="/" />;
  if (q.isPending) return <Loading />;
  const w = q.data?.find((w) => w.id === id);
  if (!w)
    return (
      <Page>
        <Notice error text={q.error?.message ?? 'Séance introuvable.'} />
        <Button label="Retour" onPress={() => router.replace('/training')} />
      </Page>
    );
  return <Player key={w.id} workout={w} catalog={cat.data} previous={stats.data?.previous ?? []} />;
}
function Player({
  workout: w,
  catalog,
  previous,
}: {
  workout: Workout;
  catalog?: Catalog;
  previous: Stats['previous'];
}) {
  const api = useApi(),
    router = useRouter(),
    [logs, setLogs] = useState<SetLog[]>(w.sets),
    [loaded, setLoaded] = useState(false),
    [revision, setRevision] = useState(w.revision),
    [conflict, setConflict] = useState(false),
    [formEpoch, setFormEpoch] = useState(0),
    [error, setError] = useState(''),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false),
    [reward, setReward] = useState<number | null>(null),
    [deadline, setDeadline] = useState(0),
    [seconds, setSeconds] = useState(0);
  const writes = useRef(Promise.resolve()),
    key = `mova-draft:${w.id}`;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then((raw) => {
      if (!active) return;
      if (raw && !w.completed_at) {
        try {
          const draft = JSON.parse(raw) as
            { revision: number; sets: SetLog[]; deadline?: number } | SetLog[];
          if (!Array.isArray(draft) && Number.isFinite(draft.deadline))
            setDeadline(draft.deadline!);
          const localRevision = Array.isArray(draft) ? 0 : draft.revision;
          const sets = Array.isArray(draft) ? draft : draft.sets;
          if (Array.isArray(sets)) {
            setLogs(sets);
            setRevision(localRevision);
            if (localRevision !== w.revision) {
              setConflict(true);
              setError(
                'Une autre version a été enregistrée. Ton brouillon est conservé ; charge la version serveur pour reprendre.',
              );
            }
          }
        } catch {
          setError('Brouillon illisible. Les dernières séries synchronisées sont affichées.');
        }
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [key, w.completed_at]);
  useEffect(() => {
    if (!loaded || w.completed_at || reward !== null || conflict) return;
    writes.current = writes.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(key, JSON.stringify({ revision, sets: logs, deadline })))
      .catch(() => {
        setError('Le stockage local est indisponible. Synchronise avant de quitter.');
      });
  }, [logs, revision, deadline, conflict, loaded, key, w.completed_at, reward]);
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [deadline]);
  function record(s: SetLog) {
    setLogs((prev) => [
      ...prev.filter((p) => !(p.exerciseId === s.exerciseId && p.index === s.index)),
      s,
    ]);
    setStatus('Brouillon local · à synchroniser');
    setDeadline(Date.now() + w.snapshot.rest * 1000);
  }
  async function sync(finish = false) {
    setBusy(true);
    setError('');
    try {
      await writes.current;
      const saved = await api.request<Workout>(
        `/workouts/${w.id}/sets`,
        { sets: logs, baseRevision: revision },
        'PUT',
      );
      setRevision(saved.revision);
      setStatus('Séries synchronisées avec le serveur.');
      if (finish) {
        const r = await api.request<{ points: number }>(`/workouts/${w.id}/finish`, {});
        setReward(r.points);
        await AsyncStorage.removeItem(key);
        await queryClient.invalidateQueries();
      }
      await queryClient.invalidateQueries({ queryKey: ['workouts'] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function loadServer() {
    setBusy(true);
    setError('');
    try {
      const fresh = await api.request<Workout>(`/workouts/${w.id}`);
      await writes.current;
      setLogs(fresh.sets);
      setRevision(fresh.revision);
      setFormEpoch((v) => v + 1);
      setConflict(false);
      queryClient.setQueryData<Workout[]>(['workouts'], (prev) =>
        prev?.map((old) => (old.id === fresh.id ? fresh : old)),
      );
      setStatus('Version serveur chargée.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function replace(exerciseId: string, alternativeId: string) {
    setBusy(true);
    setError('');
    try {
      await writes.current;
      const saved = await api.request<Workout>(
        `/workouts/${w.id}/sets`,
        { sets: logs, baseRevision: revision },
        'PUT',
      );
      setRevision(saved.revision);
      const fresh = await api.request<Workout>(`/workouts/${w.id}/replace`, {
        exerciseId,
        alternativeId,
        baseRevision: saved.revision,
      });
      setLogs(fresh.sets);
      setRevision(fresh.revision);
      queryClient.setQueryData<Workout[]>(['workouts'], (prev) =>
        prev?.map((old) => (old.id === fresh.id ? fresh : old)),
      );
      setStatus('Mouvement remplacé. Ses anciennes séries ont été retirées.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(true);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exportImage() {
    setBusy(true);
    setError('');
    try {
      const completed = await api.request<Workout>(`/workouts/${w.id}`);
      if (!completed.completed_at) throw new Error('La séance doit être terminée et synchronisée.');
      await downloadAchievementCard({
        programName: completed.snapshot.name,
        exerciseCount: completed.snapshot.exerciseIds.length,
        setCount: completed.sets.length,
        completedAt: completed.completed_at,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return <Loading />;
  if (reward !== null || w.completed_at)
    return (
      <Page>
        <Txt kind="label">UNE ÉTAPE DE PLUS POUR TOI</Txt>
        <Txt kind="hero">Tu l’as fait. ◒</Txt>
        <Card tint>
          <Txt kind="title" color="#FFF">
            Séance terminée
          </Txt>
          <Txt color="#FFF">{w.snapshot.name}</Txt>
          <Txt color="#FFF">
            {logs.length} séries · {w.snapshot.exerciseIds.length} mouvements
          </Txt>
          {reward !== null && (
            <Txt kind="hero" color="#FFF">
              +{reward} points
            </Txt>
          )}
        </Card>
        <Txt>Prends le temps de récupérer. Ta prochaine séance peut attendre un jour de repos.</Txt>
        <Notice text={error} error />
        {supportsImageCard && (
          <>
            <Button busy={busy} label="Télécharger ma carte de réussite" onPress={exportImage} />
            <Txt kind="small">
              Le PNG ne contient ni ton pseudonyme ni tes charges. Il est téléchargé sur ton
              ordinateur ; rien n’est publié automatiquement.
            </Txt>
          </>
        )}

        <Button
          label="Partager le texte de ma réussite"
          onPress={() =>
            Share.share({
              message: `J’ai terminé ma séance « ${w.snapshot.name} » avec MOVA. À mon rythme, une étape à la fois. #MOVA`,
            }).catch(() => setError('Le partage n’est pas disponible sur cet appareil.'))
          }
        />
        <Button secondary label="Retrouver mon espace" onPress={() => router.replace('/home')} />
      </Page>
    );
  const expected = w.snapshot.exerciseIds.length * w.snapshot.sets;
  return (
    <Page>
      <Row>
        <Txt kind="label">
          TA SÉANCE · {logs.length} / {expected} SÉRIES
        </Txt>
        <Button
          secondary
          label="Pause et retour"
          onPress={async () => {
            await writes.current;
            router.replace('/training');
          }}
        />
      </Row>
      <Txt kind="title">{w.snapshot.name}</Txt>
      {w.snapshot.week && (
        <Txt kind="small">
          Semaine {w.snapshot.week} · séance {w.snapshot.ordinal} · {w.snapshot.reps} répétitions
          comme repère, pas comme obligation.
        </Txt>
      )}
      {conflict && (
        <Card>
          <Notice
            error
            text="Une version plus récente existe. La synchronisation est bloquée pour éviter d’écraser tes données."
          />
          <Button
            busy={busy}
            label="Remplacer mon brouillon par la version serveur"
            onPress={loadServer}
          />
        </Card>
      )}
      <Notice text="Brouillon sportif non validé. Arrête en cas de douleur. Une série inconfortable peut être interrompue ; terminer la séance n’est jamais une obligation." />
      <Card tint>
        <Txt color="#FFF" kind="label">
          TON TEMPS DE REPOS
        </Txt>
        <Txt color="#FFF" kind="hero">
          {seconds > 0 ? `${seconds} s` : 'À ton rythme'}
        </Txt>
        <Button
          secondary
          label="Relancer le repos"
          onPress={() => setDeadline(Date.now() + w.snapshot.rest * 1000)}
        />
      </Card>
      {w.snapshot.exerciseIds.map((eid) => (
        <Card key={eid}>
          <Txt kind="title">{catalog?.exercises.find((e) => e.id === eid)?.name ?? eid}</Txt>
          <Button
            secondary
            label="Instructions et sécurité"
            onPress={() => router.push(`/exercise?id=${eid}`)}
          />
          {previous.find((s) => s.performance.exerciseId === eid) && (
            <Txt kind="small">
              Dernière série terminée :{' '}
              {previous.find((s) => s.performance.exerciseId === eid)!.performance.reps} répétitions
              · {previous.find((s) => s.performance.exerciseId === eid)!.performance.weight} kg.
            </Txt>
          )}
          {catalog?.exercises
            .filter(
              (e) =>
                catalog.exercises.find((current) => current.id === eid)?.alternativeId === e.id &&
                !w.snapshot.exerciseIds.includes(e.id),
            )
            .map((alt) => (
              <Button
                key={alt.id}
                secondary
                disabled={conflict}
                busy={busy}
                label={`Remplacer par ${alt.name} · retirer les séries de ce mouvement`}
                onPress={() => replace(eid, alt.id)}
              />
            ))}
          {Array.from({ length: w.snapshot.sets }, (_, index) => (
            <SetEntry
              key={`${formEpoch}-${eid}-${index}`}
              exerciseId={eid}
              index={index}
              existing={logs.find((s) => s.exerciseId === eid && s.index === index)}
              onRecord={record}
              reps={w.snapshot.reps}
            />
          ))}
        </Card>
      ))}
      <Notice text={error} error />
      <Notice text={status} />
      <Button
        secondary
        disabled={conflict}
        busy={busy}
        label="Synchroniser mes séries"
        onPress={() => sync()}
      />
      <Button
        busy={busy}
        disabled={logs.length !== expected || conflict}
        label="Terminer ma séance"
        onPress={() => sync(true)}
      />
      <Txt kind="small">
        Brouillon conservé sur cet appareil. Pas de synchronisation automatique en arrière-plan.
        Maximum : 50 points par jour, 3 séances récompensées par semaine. Le repos n’annule aucun
        point.
      </Txt>
    </Page>
  );
}
function SetEntry({
  exerciseId,
  index,
  existing,
  onRecord,
  reps,
}: {
  exerciseId: string;
  index: number;
  existing?: SetLog;
  onRecord: (s: SetLog) => void;
  reps: number;
}) {
  const [r, setR] = useState(existing ? String(existing.reps) : String(reps)),
    [weight, setWeight] = useState(existing ? String(existing.weight) : '0');
  const valid =
    Number.isInteger(Number(r)) &&
    Number(r) > 0 &&
    Number(r) <= 100 &&
    weight.trim() !== '' &&
    Number.isFinite(Number(weight.replace(',', '.'))) &&
    Number(weight.replace(',', '.')) >= 0 &&
    Number(weight.replace(',', '.')) <= 300;
  return (
    <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: '#B8ADBF', paddingTop: 14 }}>
      <Txt kind="label">
        SÉRIE {index + 1} {existing ? '· ENREGISTRÉE LOCALEMENT' : ''}
      </Txt>
      <Row>
        <View style={{ flex: 1, minWidth: 100 }}>
          <Field
            label={`Répétitions · série ${index + 1}`}
            keyboardType="number-pad"
            value={r}
            onChangeText={setR}
          />
        </View>
        <View style={{ flex: 1, minWidth: 100 }}>
          <Field
            label={`Charge en kg · série ${index + 1}`}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </Row>
      <Button
        secondary={!!existing}
        disabled={!valid}
        label={existing ? 'Mettre à jour la série' : 'Valider la série'}
        onPress={() =>
          onRecord({ exerciseId, index, reps: Number(r), weight: Number(weight.replace(',', '.')) })
        }
      />
    </View>
  );
}
