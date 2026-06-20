export type QueueItem = {
  file: string;
  progress: number;
  stage: string;
};

export type FeedMessage = {
  role: "bot" | "manager";
  content: string;
  time: string;
};

export type PlayerCard = {
  player_name: string;
  team_name: string;
  passes: number;
  pass_accuracy: number;
  shots: number;
  goals: number;
  dribbles_completed: number;
  duels_won: number;
  duels_lost: number;
  fouls_committed: number;
  fouls_won: number;
};
