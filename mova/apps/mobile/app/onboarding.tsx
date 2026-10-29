import { useState } from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useApi, queryClient, type Me } from '../src/client';
import { Button, Card, Notice, Page, Row, Txt } from '../src/ui';
import type { Preferences } from '@mova/domain';
export default function Onboarding() {
  const api = useApi(),
    router = useRouter(),
    [step, setStep] = useState(0),
    [p, setP] = useState<Preferences>({
      goal: 'routine',
      level: 'beginner',
      location: 'home',
      days: 2,
      minutes: 20,
    }),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  if (!api.token) return <Redirect href="/" />;
  const choices = [
    {
      key: 'goal',
      title: 'Qu’est-ce qui t’amène ?',
      items: [
        ['routine', 'Construire une routine'],
        ['strength', 'Me sentir plus forte'],
        ['restart', 'Reprendre en douceur'],
      ],
    },
    {
      key: 'level',
      title: 'On part d’où ?',
      items: [
        ['beginner', 'Je débute ou je reprends'],
        ['intermediate', 'Je pratique déjà régulièrement'],
      ],
    },
    {
      key: 'location',
      title: 'Ton terrain de jeu ?',
      items: [
        ['home', 'À la maison · sans matériel'],
        ['gym', 'En salle · machines disponibles'],
      ],
    },
    {
      key: 'days',
      title: 'Un rythme réaliste',
      items: [
        [2, '2 séances par semaine'],
        [3, '3 séances par semaine'],
      ],
    },
    {
      key: 'minutes',
      title: 'Du temps pour toi',
      items: [
        [20, 'Environ 20 minutes'],
        [40, 'Environ 40 minutes'],
      ],
    },
  ] as const;
  const c = choices[step]!;
  async function finish() {
    setBusy(true);
    setError('');
    try {
      const r = await api.request<{ recommendedProgramId: string }>('/me/onboarding', p, 'PUT');
      queryClient.setQueryData<Me>(['me'], (previous) =>
        previous ? { ...previous, preferences: p } : previous,
      );
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      router.replace(`/program?id=${r.recommendedProgramId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Txt kind="label">
        TON DÉPART · {step + 1} / {choices.length}
      </Txt>
      <Txt kind="hero">{c.title}</Txt>
      <Txt>Pas de bonne réponse. Choisis ce qui te convient aujourd’hui.</Txt>
      <Card>
        {c.items.map(([value, label]) => (
          <Button
            key={value}
            secondary={p[c.key] !== value}
            label={`${p[c.key] === value ? '● ' : ''}${label}`}
            onPress={() => setP({ ...p, [c.key]: value })}
          />
        ))}
      </Card>
      <Notice text={error} error />
      <Row>
        {step > 0 && <Button secondary label="Retour" onPress={() => setStep(step - 1)} />}
        <Button
          busy={busy}
          label={step === choices.length - 1 ? 'Voir mon programme' : 'Continuer'}
          onPress={() => (step === choices.length - 1 ? finish() : setStep(step + 1))}
        />
      </Row>
      <Txt kind="small">
        Nous ne demandons ni poids ni informations médicales. Les recommandations du pilote
        utilisent uniquement le lieu et la durée ; l’adaptation avancée reste à développer.
      </Txt>
    </Page>
  );
}
