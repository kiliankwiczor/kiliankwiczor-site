export type AchievementData = {
  programName: string;
  exerciseCount: number;
  setCount: number;
  completedAt: string;
};
export const supportsImageCard = false;
export const downloadAchievementCard: (data: AchievementData) => Promise<void> = async () => {
  throw new Error(
    'L’export graphique est disponible sur ordinateur. Le partage texte reste disponible sur mobile.',
  );
};
