import type { AchievementData } from './achievementCard';
export const supportsImageCard = true;
export async function downloadAchievementCard(data: AchievementData) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Le navigateur ne permet pas de créer cette image.');
  ctx.fillStyle = '#F7F5F1';
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = '#E9E1F1';
  ctx.beginPath();
  ctx.arc(1040, 300, 380, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#573B68';
  ctx.font = '700 64px Arial, sans-serif';
  ctx.fillText('mova', 90, 170);
  ctx.strokeStyle = '#573B68';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(295, 148, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '700 28px Arial, sans-serif';
  ctx.fillText('SÉANCE TERMINÉE', 90, 350);
  ctx.font = '700 112px Arial, sans-serif';
  for (const [i, line] of ['Une étape', 'de plus', 'pour toi.'].entries())
    ctx.fillText(line, 90, 550 + i * 126);
  ctx.fillStyle = '#573B68';
  ctx.beginPath();
  ctx.roundRect(70, 980, 940, 560, 42);
  ctx.fill();
  ctx.fillStyle = '#E9E1F1';
  ctx.font = '700 27px Arial, sans-serif';
  ctx.fillText('MA PETITE VICTOIRE DU JOUR', 120, 1060);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 58px Arial, sans-serif';
  const lines: string[] = [];
  let line = '';
  for (const word of data.programName.split(/\s+/)) {
    const candidate = line ? line + ' ' + word : word;
    if (ctx.measureText(candidate).width > 820 && line) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  for (const [i, text] of lines.slice(0, 3).entries()) ctx.fillText(text, 120, 1170 + i * 73, 820);
  ctx.font = '400 38px Arial, sans-serif';
  ctx.fillText(
    `${data.exerciseCount} mouvements · ${data.setCount} séries enregistrées`,
    120,
    1460,
    820,
  );
  ctx.fillStyle = '#573B68';
  ctx.font = '400 30px Arial, sans-serif';
  ctx.fillText(
    new Date(data.completedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    }),
    90,
    1660,
  );
  ctx.font = '700 33px Arial, sans-serif';
  ctx.fillText('Ta progression. Ta communauté. Ton rythme.', 90, 1785, 900);
  ctx.font = '400 26px Arial, sans-serif';
  ctx.fillText('À mon rythme, une étape à la fois.', 90, 1840);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('La création du PNG a échoué.'))),
      'image/png',
    ),
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mova-ma-seance.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
