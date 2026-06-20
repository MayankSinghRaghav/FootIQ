import { CircleDot } from "lucide-react";
import type { PlayerCard as PlayerCardType } from "../types";
import { Radar, mapPlayerToRadar } from "./Radar";

export function PlayerCard({ player, index }: { player: PlayerCardType; index: number }) {
  return (
    <article className="glass-panel rounded-xl p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xl font-semibold uppercase">{player.player_name}</p>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/65">{player.team_name}</p>
        </div>
        <span className="rounded bg-[#00ff41]/15 px-2 py-1 font-mono text-xs text-[#00ff41]">
          {(player.pass_accuracy / 10).toFixed(1)}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="h-24 w-24 rounded bg-gradient-to-b from-white/30 to-white/5" />
        <Radar stats={mapPlayerToRadar(player)} color={index === 1 ? "#00d1ff" : "#00ff41"} />
      </div>

      <div className="mb-2 flex items-center gap-2 text-[#00d1ff]">
        <CircleDot size={14} />
        <p className="font-mono text-xs uppercase tracking-[0.16em]">AI Insight</p>
      </div>
      <p className="text-sm leading-6 text-white/80">
        Completed {player.passes} passes at {player.pass_accuracy}% accuracy with {player.shots} shots,{" "}
        {player.goals} goals, and duel output {player.duels_won}/{player.duels_lost}.
      </p>
    </article>
  );
}
