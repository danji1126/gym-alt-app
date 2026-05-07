// Client wrapper for lazy-loaded BodyDiagram.
// Next.js 15: `next/dynamic({ ssr: false })`는 Client Component에서만 허용.
// 라이브러리(react-body-highlighter)는 SSR 비호환으로 ssr: false 필요.
"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type BodyDiagram from "./body-diagram";

const LazyBodyDiagram = dynamic(() => import("./body-diagram"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-100">
      <div className="aspect-[1/2] animate-pulse rounded bg-neutral-100 dark:bg-neutral-200" />
      <div className="aspect-[1/2] animate-pulse rounded bg-neutral-100 dark:bg-neutral-200" />
    </div>
  ),
});

export function BodyDiagramLoader(props: ComponentProps<typeof BodyDiagram>) {
  return <LazyBodyDiagram {...props} />;
}
