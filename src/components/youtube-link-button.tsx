// Design Ref: §5.4 + §11.5 — External YouTube search link button.
// RSC OK — interaction은 브라우저 기본 동작(새 탭 열기)뿐.
// Plan FR-07: target="_blank" + rel="noopener noreferrer".

interface Props {
  url: string;
  exerciseName: string;
}

export function YoutubeLinkButton({ url, exerciseName }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${exerciseName} YouTube 시연 검색 (새 탭)`}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-400"
    >
      <span aria-hidden="true">▶</span>
      <span>YouTube 시연 검색</span>
    </a>
  );
}
