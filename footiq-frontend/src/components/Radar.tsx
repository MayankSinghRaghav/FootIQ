import { useMemo } from "react";
import type { PlayerCard } from "../types";

export function mapPlayerToRadar(player: PlayerCard): [number, number, number, number, number] {
  const pace = Math.min(100, 45 + player.dribbles_completed * 6);
  const passing = Math.min(100, player.pass_accuracy);
  const duels = Math.min(100, 35 + player.duels_won * 8);
  const attack = Math.min(100, 50 + player.shots * 8 + player.goals * 12);
  const control = Math.min(100, 50 + player.passes * 2);
  return [pace, passing, duels, attack, control];
}

export function Radar({ stats, color }: { stats: [number, number, number, number, number]; color: string }) {
  const points = useMemo(() => {
    const center = 55;
    const radius = 38;
    return stats
      .map((val, i) => {
        const angle = ((Math.PI * 2) / stats.length) * i - Math.PI / 2;
        const r = (val / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  }, [stats]);

  return (
    <svg viewBox="0 0 110 110" className="h-24 w-24">
      <polygon points="55,10 95,37 80,92 30,92 15,37" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <polygon points={points} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}
