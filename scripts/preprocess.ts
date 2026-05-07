// Design Ref: §11.5 — Build-time merge + classify + validate + emit.
// Plan SC: 873/873 ID match, no missing equipment classifications, fail-fast on errors.

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  RawExercise,
  TranslationsFile,
  EnrichedExercise,
  DetailedEquipment,
} from "../src/lib/types";
import { classifyDetailedEquipment } from "./lib/detailed-equipment";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), "..");

const SRC_EXERCISES = resolve(ROOT, "data/exercises.json");
const SRC_TRANSLATIONS = resolve(ROOT, "data/translations.json");
const OUT_DIR = resolve(ROOT, "public/data");
const OUT_FILE = resolve(OUT_DIR, "exercises-ko.json");

const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// ────────────────────────────────────────────────────────────────────────────
// Error helpers
// ────────────────────────────────────────────────────────────────────────────

type ErrCode =
  | "ERR_DUPLICATE_ID"
  | "ERR_MISSING_TRANSLATION"
  | "ERR_ORPHAN_TRANSLATION"
  | "ERR_EMPTY_TRANSLATION"
  | "ERR_NO_EQUIPMENT_CLASS";

function fail(code: ErrCode, detail: string, hint?: string): never {
  console.error(`[preprocess] FATAL ${code}`);
  console.error(`  ${detail}`);
  if (hint) console.error(`  Hint: ${hint}`);
  process.exit(1);
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const t0 = Date.now();
  console.log("[preprocess] start");

  // Load sources
  const exercises = JSON.parse(
    await readFile(SRC_EXERCISES, "utf-8"),
  ) as RawExercise[];
  const translations = JSON.parse(
    await readFile(SRC_TRANSLATIONS, "utf-8"),
  ) as TranslationsFile;

  console.log(
    `[preprocess] loaded ${exercises.length} exercises, ` +
      `${Object.keys(translations.names).length} name translations, ` +
      `${Object.keys(translations.instructions).length} instruction translations`,
  );

  // Validation 1: Duplicate IDs in source
  const seenIds = new Set<string>();
  for (const ex of exercises) {
    if (seenIds.has(ex.id)) {
      fail("ERR_DUPLICATE_ID", `Duplicate ID in exercises.json: ${ex.id}`);
    }
    seenIds.add(ex.id);
  }

  // Validation 2: Bidirectional ID matching (names)
  for (const ex of exercises) {
    if (!(ex.id in translations.names)) {
      fail(
        "ERR_MISSING_TRANSLATION",
        `Missing nameKo for ID: ${ex.id} (name: "${ex.name}")`,
        "Add the entry in data/translations.json under .names",
      );
    }
    if (!(ex.id in translations.instructions)) {
      fail(
        "ERR_MISSING_TRANSLATION",
        `Missing instructionsKo for ID: ${ex.id} (name: "${ex.name}")`,
        "Add the entry in data/translations.json under .instructions",
      );
    }
  }
  for (const id of Object.keys(translations.names)) {
    if (!seenIds.has(id)) {
      fail(
        "ERR_ORPHAN_TRANSLATION",
        `Translation .names has no matching exercise: ${id}`,
        "Remove from translations.json or restore the original entry in exercises.json",
      );
    }
  }
  for (const id of Object.keys(translations.instructions)) {
    if (!seenIds.has(id)) {
      fail(
        "ERR_ORPHAN_TRANSLATION",
        `Translation .instructions has no matching exercise: ${id}`,
      );
    }
  }

  // Merge + classify
  const enriched: EnrichedExercise[] = exercises.map((ex) => {
    const nameKo = translations.names[ex.id];
    const instructionsKo = translations.instructions[ex.id];

    if (!nameKo || nameKo.trim() === "") {
      fail("ERR_EMPTY_TRANSLATION", `Empty nameKo for ID: ${ex.id}`);
    }
    if (!instructionsKo || instructionsKo.length === 0) {
      fail(
        "ERR_EMPTY_TRANSLATION",
        `Empty instructionsKo for ID: ${ex.id}`,
      );
    }

    const detailedEquipment = classifyDetailedEquipment(ex.name, ex.equipment);
    if (detailedEquipment.length === 0) {
      // Defensive — classifyDetailedEquipment always returns >=1 by contract.
      fail(
        "ERR_NO_EQUIPMENT_CLASS",
        `No detailedEquipment classified for: "${ex.name}" (id: ${ex.id}, equipment: ${ex.equipment})`,
        "Add a regex rule in scripts/lib/detailed-equipment.ts or extend EquipmentRaw fallback in src/lib/types.ts",
      );
    }

    return {
      id: ex.id,
      nameEn: ex.name,
      instructionsEn: ex.instructions,
      nameKo: nameKo.trim(),
      instructionsKo: instructionsKo,
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      force: ex.force,
      level: ex.level,
      mechanic: ex.mechanic,
      category: ex.category,
      equipmentRaw: ex.equipment,
      detailedEquipment,
      imageUrls: ex.images.map((p) => `${IMAGE_BASE_URL}${p}`),
      youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${ex.name} form`,
      )}`,
    };
  });

  // Sort for reproducibility
  enriched.sort((a, b) => a.id.localeCompare(b.id));

  // Distribution report
  const dist = new Map<DetailedEquipment, number>();
  for (const e of enriched) {
    for (const eq of e.detailedEquipment) {
      dist.set(eq, (dist.get(eq) ?? 0) + 1);
    }
  }
  console.log("[preprocess] DetailedEquipment distribution:");
  const sorted = [...dist.entries()].sort((a, b) => b[1] - a[1]);
  for (const [k, v] of sorted) {
    console.log(`  ${k.padEnd(28)} ${v}`);
  }

  // Write output
  await mkdir(OUT_DIR, { recursive: true });
  const json = JSON.stringify(enriched);
  await writeFile(OUT_FILE, json, "utf-8");

  // Size report
  const fileStat = await stat(OUT_FILE);
  const gzipSize = gzipSync(Buffer.from(json, "utf-8")).length;
  const elapsed = Date.now() - t0;

  console.log(
    `[preprocess] OK — ${enriched.length} exercises -> ${OUT_FILE}`,
  );
  console.log(
    `[preprocess] size: ${(fileStat.size / 1024).toFixed(1)} KB raw, ` +
      `${(gzipSize / 1024).toFixed(1)} KB gzip`,
  );
  console.log(`[preprocess] elapsed: ${elapsed} ms`);

  // Plan SC: gzip <= 500KB warning (not fatal)
  if (gzipSize > 500 * 1024) {
    console.warn(
      `[preprocess] WARN gzip size ${(gzipSize / 1024).toFixed(1)} KB exceeds 500 KB target`,
    );
  }
}

main().catch((err: unknown) => {
  console.error("[preprocess] UNEXPECTED ERROR");
  console.error(err);
  process.exit(1);
});
