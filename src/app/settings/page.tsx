// Design Ref: §5.1 Settings + §11.1 — Preset editor page.
// Client component (LocalStorage 의존). 정적 export 호환 (dynamic route 아님).
// M6: hydrated msg 제거 + 0/20 빈 상태 안내 추가.
"use client";

import Link from "next/link";
import { usePreset } from "@/lib/preset-store";
import { EquipmentToggleGrid } from "@/components/equipment-toggle-grid";
import { BackLink } from "@/components/back-link";

export default function SettingsPage() {
  const { preset, toggleEquipment, reset } = usePreset();
  const count = preset.availableEquipment.length;

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <BackLink />

      <header className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">⚙️ 헬스장 설정</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          현재 프리셋: <span className="font-medium">{preset.name}</span>
        </p>
      </header>

      <section className="mt-6">
        <EquipmentToggleGrid
          selected={preset.availableEquipment}
          onToggle={toggleEquipment}
          variant="box"
        />
      </section>

      <section className="mt-8 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            활성 기구: <span className="font-semibold">{count}</span> / 20
          </p>
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-lg px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900"
          >
            기본값으로 리셋
          </button>
        </div>
        {count === 0 && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            최소 1개 이상 기구 선택을 권장합니다.
          </p>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="underline">
          홈으로
        </Link>
      </p>
    </main>
  );
}
