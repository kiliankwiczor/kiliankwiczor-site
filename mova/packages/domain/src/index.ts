import { z } from 'zod';
export const brand = { name: 'MOVA', promise: 'Ta progression. Ta communauté. Ton rythme.' };
export const onboardingSchema = z.object({
  goal: z.enum(['routine', 'strength', 'restart']),
  level: z.enum(['beginner', 'intermediate']),
  location: z.enum(['home', 'gym']),
  days: z.number().int().min(2).max(3),
  minutes: z.union([z.literal(20), z.literal(40)]),
});
export type Preferences = z.infer<typeof onboardingSchema>;
export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  instructions: string[];
  safety: string;
  mistakes: string;
  alternativeId: string;
  status: 'pending_review';
};
export const exercises: Exercise[] = [
  {
    id: 'squat',
    name: 'Squat au poids du corps',
    muscle: 'Quadriceps · fessiers',
    equipment: 'Sans matériel',
    instructions: [
      'Pieds à une largeur confortable, appuis stables.',
      'Fléchis hanches et genoux dans une amplitude confortable.',
      'Repousse le sol pour te redresser sans bloquer les genoux.',
    ],
    safety: 'Réduis l’amplitude en cas d’inconfort. Une douleur est un signal pour arrêter.',
    mistakes: 'Ne force pas une profondeur qui arrondit le dos.',
    alternativeId: 'chair',
    status: 'pending_review',
  },
  {
    id: 'chair',
    name: 'Assis-debout sur chaise',
    muscle: 'Quadriceps · fessiers',
    equipment: 'Chaise stable contre un mur',
    instructions: [
      'Place une chaise stable contre un mur.',
      'Assieds-toi lentement en gardant les pieds au sol.',
      'Relève-toi avec une aide des mains si nécessaire.',
    ],
    safety: 'Vérifie la stabilité de la chaise avant chaque série.',
    mistakes: 'Évite de te laisser tomber sur l’assise.',
    alternativeId: 'squat',
    status: 'pending_review',
  },
  {
    id: 'bridge',
    name: 'Pont fessier',
    muscle: 'Fessiers',
    equipment: 'Tapis',
    instructions: [
      'Allonge-toi, genoux fléchis et pieds au sol.',
      'Soulève le bassin en gardant les côtes détendues.',
      'Redescends avec contrôle.',
    ],
    safety: 'Évite de creuser le bas du dos pour monter plus haut.',
    mistakes: 'Ne cherche pas une hauteur maximale.',
    alternativeId: 'hip-thrust',
    status: 'pending_review',
  },
  {
    id: 'wall-push',
    name: 'Pompes au mur',
    muscle: 'Pectoraux · triceps',
    equipment: 'Mur',
    instructions: [
      'Mains contre un mur, légèrement plus larges que les épaules.',
      'Approche le buste en fléchissant les coudes.',
      'Repousse avec contrôle, corps aligné.',
    ],
    safety: 'Rapproche les pieds du mur pour réduire la difficulté.',
    mistakes: 'Ne laisse pas le bassin partir vers l’avant.',
    alternativeId: 'bench',
    status: 'pending_review',
  },
  {
    id: 'row',
    name: 'Rowing avec haltères',
    muscle: 'Dos · biceps',
    equipment: 'Haltères',
    instructions: [
      'Incline le buste depuis les hanches, dos confortable.',
      'Ramène les coudes près du corps.',
      'Redescends lentement sans élan.',
    ],
    safety: 'Commence léger et garde une respiration libre.',
    mistakes: 'Évite de tirer en donnant de l’élan.',
    alternativeId: 'cable-row',
    status: 'pending_review',
  },
  {
    id: 'plank',
    name: 'Gainage sur les genoux',
    muscle: 'Tronc',
    equipment: 'Tapis',
    instructions: [
      'Avant-bras au sol, genoux posés.',
      'Garde un alignement épaules-bassin-genoux.',
      'Respire normalement ; une répétition correspond ici à une respiration lente.',
    ],
    safety: 'Arrête si tu ne peux plus respirer librement.',
    mistakes: 'Ne retiens pas ta respiration.',
    alternativeId: 'wall-push',
    status: 'pending_review',
  },
  {
    id: 'hip-thrust',
    name: 'Hip thrust',
    muscle: 'Fessiers',
    equipment: 'Banc stable',
    instructions: [
      'Haut du dos en appui sur un banc stable.',
      'Pieds au sol, soulève le bassin sans cambrer.',
      'Redescends avec contrôle.',
    ],
    safety: 'Fais vérifier l’installation par une professionnelle avant d’ajouter une charge.',
    mistakes: 'Évite l’hyperextension lombaire.',
    alternativeId: 'bridge',
    status: 'pending_review',
  },
  {
    id: 'leg-press',
    name: 'Presse à cuisses',
    muscle: 'Quadriceps · fessiers',
    equipment: 'Machine guidée',
    instructions: [
      'Fais régler la machine à ta morphologie.',
      'Fléchis dans une amplitude qui garde le bassin en appui.',
      'Pousse sans verrouiller les genoux.',
    ],
    safety: 'Demande une démonstration et vérifie les sécurités de la machine.',
    mistakes: 'Ne décolle pas le bassin du dossier.',
    alternativeId: 'squat',
    status: 'pending_review',
  },
  {
    id: 'rdl',
    name: 'Soulevé de terre roumain',
    muscle: 'Ischio-jambiers · fessiers',
    equipment: 'Haltères',
    instructions: [
      'Genoux souples, haltères près des cuisses.',
      'Recule les hanches en gardant les charges près du corps.',
      'Reviens debout avec contrôle.',
    ],
    safety: 'Apprends le mouvement avec une professionnelle avant de charger.',
    mistakes: 'Ne cherche pas à toucher le sol.',
    alternativeId: 'bridge',
    status: 'pending_review',
  },
  {
    id: 'lunge',
    name: 'Fente arrière assistée',
    muscle: 'Quadriceps · fessiers',
    equipment: 'Appui stable',
    instructions: [
      'Tiens un appui stable.',
      'Recule un pied, fléchis légèrement les deux genoux.',
      'Reviens et alterne les côtés ; compte le total des répétitions.',
    ],
    safety: 'Réduis l’amplitude si l’équilibre est difficile.',
    mistakes: 'Évite les pas trop étroits.',
    alternativeId: 'chair',
    status: 'pending_review',
  },
  {
    id: 'cable-row',
    name: 'Tirage horizontal',
    muscle: 'Dos · biceps',
    equipment: 'Poulie',
    instructions: [
      'Assieds-toi avec des appuis stables.',
      'Ramène les poignées vers le buste.',
      'Accompagne le retour sans arrondir excessivement le dos.',
    ],
    safety: 'Demande le réglage adapté de la machine.',
    mistakes: 'Ne donne pas d’élan avec le buste.',
    alternativeId: 'row',
    status: 'pending_review',
  },
  {
    id: 'pulldown',
    name: 'Tirage vertical',
    muscle: 'Dos · biceps',
    equipment: 'Poulie haute',
    instructions: [
      'Règle l’appui des cuisses.',
      'Tire la barre devant toi vers le haut du buste.',
      'Remonte lentement.',
    ],
    safety: 'Ne tire pas la barre derrière la nuque.',
    mistakes: 'Évite de basculer fortement en arrière.',
    alternativeId: 'row',
    status: 'pending_review',
  },
  {
    id: 'bench',
    name: 'Développé couché avec haltères',
    muscle: 'Pectoraux · triceps',
    equipment: 'Banc · haltères',
    instructions: [
      'Installe-toi sur un banc stable avec une charge légère.',
      'Descends les haltères dans une amplitude confortable.',
      'Pousse au-dessus du buste avec contrôle.',
    ],
    safety: 'Demande de l’aide pour l’installation si nécessaire.',
    mistakes: 'Ne rebondis pas en bas du mouvement.',
    alternativeId: 'wall-push',
    status: 'pending_review',
  },
  {
    id: 'shoulder',
    name: 'Développé épaules',
    muscle: 'Épaules · triceps',
    equipment: 'Haltères',
    instructions: [
      'Assieds-toi avec le dos soutenu.',
      'Pousse les haltères vers le haut dans une amplitude confortable.',
      'Redescends avec contrôle.',
    ],
    safety: 'Arrête si une douleur apparaît à l’épaule.',
    mistakes: 'Ne cambre pas pour finir une répétition.',
    alternativeId: 'wall-push',
    status: 'pending_review',
  },
];
export type Program = {
  id: string;
  name: string;
  weeks: number;
  days: number;
  minutes: number;
  location: 'home' | 'gym';
  tier: 'free' | 'plus' | 'premium';
  exerciseIds: string[];
  sets: number;
  reps: number;
  rest: number;
  status: 'pending_review';
};
const spec = [
  [
    'first',
    'Première séance en salle',
    1,
    2,
    40,
    'gym',
    'free',
    ['leg-press', 'cable-row', 'wall-push'],
  ],
  [
    'start',
    'Tes quatre premières semaines',
    4,
    2,
    20,
    'home',
    'free',
    ['chair', 'bridge', 'wall-push'],
  ],
  ['beginner', 'Débuter en 8 semaines', 8, 2, 40, 'gym', 'plus', ['squat', 'cable-row', 'bridge']],
  ['full', 'Full body · 3 jours', 4, 3, 40, 'gym', 'plus', ['leg-press', 'pulldown', 'bench']],
  ['lower', 'Bas du corps', 4, 2, 40, 'gym', 'plus', ['hip-thrust', 'leg-press', 'lunge']],
  ['upper', 'Haut du corps', 4, 2, 40, 'gym', 'plus', ['cable-row', 'bench', 'shoulder']],
  ['home', 'Ta routine à la maison', 4, 2, 20, 'home', 'free', ['squat', 'bridge', 'wall-push']],
  ['express', 'Renforcement express', 4, 2, 20, 'home', 'free', ['chair', 'wall-push', 'plank']],
  [
    'intermediate',
    'Progression intermédiaire',
    6,
    3,
    40,
    'gym',
    'premium',
    ['rdl', 'bench', 'cable-row'],
  ],
  ['strength', 'Force générale', 6, 3, 40, 'gym', 'premium', ['squat', 'rdl', 'pulldown']],
] as const;
export const programs: Program[] = spec.map(
  ([id, name, weeks, days, minutes, location, tier, exerciseIds]) => ({
    id,
    name,
    weeks,
    days,
    minutes,
    location,
    tier,
    exerciseIds: [...exerciseIds],
    sets: 2,
    reps: 8,
    rest: 60,
    status: 'pending_review',
  }),
);
export function recommend(p: Preferences): string {
  if (p.location === 'gym') return 'first';
  return p.minutes === 20 ? 'express' : 'start';
}
export const setSchema = z.object({
  exerciseId: z.string(),
  index: z.number().int().min(0).max(5),
  reps: z.number().int().min(1).max(100),
  weight: z.number().min(0).max(300),
});
export const sessionSchema = z.object({ programId: z.string(), sets: z.array(setSchema).max(60) });
export function validateCompletedSets(p: Program, sets: z.infer<typeof setSchema>[]): boolean {
  const keys = new Set(sets.map((s) => `${s.exerciseId}:${s.index}`));
  return (
    sets.length === p.exerciseIds.length * p.sets &&
    keys.size === sets.length &&
    p.exerciseIds.every((id) =>
      Array.from({ length: p.sets }, (_, i) => keys.has(`${id}:${i}`)).every(Boolean),
    )
  );
}
export function canAccess(
  tier: string,
  grants: { kind: string; program_id: string | null; expires_at: string | null }[],
  program: Program,
  now = Date.now(),
) {
  return (
    program.tier === 'free' ||
    grants.some(
      (g) =>
        (!g.expires_at || Date.parse(g.expires_at) > now) &&
        ((g.kind === 'purchase' && g.program_id === program.id) ||
          g.kind === 'premium' ||
          (g.kind === 'plus' && program.tier === 'plus')),
    )
  );
}

export { programStep, challengeProgress } from './progression.ts';
