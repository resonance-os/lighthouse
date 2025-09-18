// modules/hana/lib/rng.ts
// 決定的乱数ジェネレータ

const RNG_SEED = Number(Deno.env.get("RNG_SEED") ?? 1);

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(RNG_SEED);

/**
 * ジッター付き待機
 * @param ms ベースの待機時間
 * @param j ジッター幅（ミリ秒）
 * @returns 実際の待機時間
 */
export const jitter = (ms: number, j: number): number => {
  if (j <= 0) return ms;
  return Math.max(0, ms + Math.floor(rand() * (j * 2 + 1)) - j);
};

// 使用例
// await new Promise(r => setTimeout(r, jitter(1000, 200)));
