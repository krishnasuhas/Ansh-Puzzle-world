const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type BestScore = {
  grid: number;
  mode: string;
  best_moves: number | null;
  best_time_seconds: number | null;
  plays: number;
};

export type ScorePayload = {
  grid: number;
  mode: string;
  photo_id: string;
  moves: number;
  time_seconds: number;
};

export async function saveScore(payload: ScorePayload): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/api/scores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.log("saveScore error", e);
    return false;
  }
}

export async function getBestScore(
  grid: number,
  mode: string,
): Promise<BestScore | null> {
  try {
    const res = await fetch(
      `${BASE}/api/scores/best?grid=${grid}&mode=${mode}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as BestScore;
  } catch (e) {
    console.log("getBestScore error", e);
    return null;
  }
}
