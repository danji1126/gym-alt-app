// Client-side lazy fetch for the 873-exercise dataset.
// /simplify: 클라이언트 컴포넌트가 lib/data를 import하면 webpack이 1.4MB JSON을
// 페이지 번들에 포함시켜 First Load JS가 폭증한다.
// 해결: 클라이언트는 정적 export로 복사된 /data/exercises-ko.json을 fetch로 로드.
"use client";

import { useEffect, useState } from "react";
import type { EnrichedExercise } from "./types";

const DATA_URL = "/data/exercises-ko.json";

// 모듈 스코프 캐시 — 모든 컴포넌트가 같은 fetch를 공유.
let cache: readonly EnrichedExercise[] | null = null;
let pending: Promise<readonly EnrichedExercise[]> | null = null;

function load(): Promise<readonly EnrichedExercise[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch(DATA_URL, { cache: "force-cache" })
      .then((r) => r.json() as Promise<EnrichedExercise[]>)
      .then((d) => {
        cache = d;
        return d;
      });
  }
  return pending;
}

/**
 * 873 운동 데이터셋 lazy fetch.
 * - 처음 mount 시 fetch (force-cache로 브라우저 HTTP 캐시 활용)
 * - 모듈 캐시 후엔 동기적 즉시 반환
 * - 데이터 미준비 동안 null 반환 — 호출처가 빈 상태 또는 스켈레톤 처리
 */
export function useExercises(): readonly EnrichedExercise[] | null {
  const [data, setData] = useState<readonly EnrichedExercise[] | null>(cache);

  useEffect(() => {
    if (cache) {
      if (data !== cache) setData(cache);
      return;
    }
    let alive = true;
    load().then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [data]);

  return data;
}
