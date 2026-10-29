import { useRouter } from 'expo-router';
import { Button, Card, Page, Txt } from '../src/ui';
export default function Legal() {
  const r = useRouter();
  return (
    <Page>
      <Button secondary label="← Retour" onPress={() => r.back()} />
      <Txt kind="hero">Un espace respectueux.</Txt>
      <Card>
        <Txt kind="title">Conditions du pilote · brouillon</Txt>
        <Txt>
          Réservé aux personnes majeures et aux données de test. MOVA est un nom provisoire. Ce
          logiciel est en développement et n’est pas ouvert à une utilisation commerciale.
        </Txt>
        <Txt>
          Les contenus sportifs attendent une validation professionnelle. Ils ne constituent pas un
          avis médical. Aucune transformation physique n’est promise.
        </Txt>
      </Card>
      <Card>
        <Txt kind="title">Tes données</Txt>
        <Txt>
          Email et mot de passe pour le compte ; pseudonyme et présentation visibles dans la
          communauté ; préférences et séances privées. Pas de poids ni de données médicales
          demandés. Les mots de passe sont hachés. Les séries non synchronisées restent sur
          l’appareil jusqu’à synchronisation ou déconnexion.
        </Txt>
        <Txt>
          Tu peux exporter et supprimer ton compte depuis Profil. Aucun outil publicitaire, traceur
          marketing ou envoi commercial n’est activé. L’éditeur, le contact RGPD, les durées de
          sauvegarde et la base légale devront être renseignés et validés avant toute collecte
          réelle.
        </Txt>
      </Card>
      <Card>
        <Txt kind="title">Règles de communauté</Txt>
        <Txt>
          Respect, consentement, aucune injonction corporelle ni harcèlement. Ne publie pas de
          données privées. Signale un contenu problématique depuis la conversation ; bloque une
          membre si nécessaire. Aucune modération permanente n’est assurée pendant le pilote.
        </Txt>
      </Card>
    </Page>
  );
}
