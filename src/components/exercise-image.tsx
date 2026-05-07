// Design Ref: §6.2 + §11.7 — onError fallback for external GitHub raw images.
// PRD TV-1 대응 — 핫링크 차단 시 회색 fallback + 운동명만 표시.
"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt: string;
  /** 첫 이미지만 eager. 나머지는 lazy. */
  eager?: boolean;
}

export function ExerciseImage({ src, alt, eager = false }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex aspect-video w-full items-center justify-center rounded-lg bg-neutral-200 px-3 text-center text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      >
        <span>
          이미지 로드 실패
          <br />
          <span className="text-neutral-700 dark:text-neutral-300">{alt}</span>
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Design §7.2 — output:'export' + unoptimized라 next/image 효익 적고 onError 처리 자유로움
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      onError={() => setErrored(true)}
      className="aspect-video w-full rounded-lg bg-neutral-100 object-cover dark:bg-neutral-900"
    />
  );
}
