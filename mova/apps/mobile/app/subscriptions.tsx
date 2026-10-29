import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useApi } from '../src/client';
import { Button, Card, Notice, Page, Txt } from '../src/ui';
export default function Subscriptions() {
  const { request } = useApi(),
    router = useRouter(),
    q = useQuery({
      queryKey: ['billing'],
      queryFn: () =>
        request<{
          enabled: boolean;
          message: string;
          entitlements: { kind: string; program_id: string | null; expires_at: string | null }[];
        }>('/billing'),
    });
  return (
    <Page>
      <Button secondary label="← Retour" onPress={() => router.back()} />
      <Txt kind="hero">Une place pour chacune.</Txt>
      <Notice text="Aucun paiement dans ce pilote. Prix envisagés à tester, sans offre commerciale active. Les prix de vente devront provenir des stores." />
      {[
        ['FREE', '0 €', 'Compte, communauté textuelle, initiation et suivi de séance.'],
        [
          'PLUS',
          '5,99 € / mois envisagés',
          'Programmes et statistiques avancées : prévus, non commercialisés.',
        ],
        [
          'PREMIUM',
          '9,99 € / mois envisagés',
          'Catalogue et personnalisation avancée : prévus, non commercialisés.',
        ],
      ].map(([name, price, body]) => (
        <Card key={name}>
          <Txt kind="label">{name}</Txt>
          <Txt kind="title">{price}</Txt>
          <Txt>{body}</Txt>
        </Card>
      ))}
      <Notice error={!!q.error} text={q.error?.message ?? q.data?.message} />
      <Txt kind="title">Droits actuels</Txt>
      {q.data?.entitlements.length === 0 && <Txt>Offre gratuite. Aucun achat enregistré.</Txt>}
      {q.data?.entitlements.map((e, i) => (
        <Txt key={i}>
          {e.kind} {e.program_id ?? ''} ·{' '}
          {e.expires_at
            ? `expiration ${new Date(e.expires_at).toLocaleDateString('fr-FR')}`
            : 'achat permanent'}
        </Txt>
      ))}
      <Txt kind="small">
        Achat, restauration, offres et synchronisation RevenueCat restent à intégrer et tester dans
        les sandbox Apple/Google.
      </Txt>
    </Page>
  );
}
