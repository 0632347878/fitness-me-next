// ─── Cyrillic → Latin transliteration table ───────────────────────────────────
const CYR_MAP: Record<string, string> = {
  а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ё:"yo", ж:"zh", з:"z",
  и:"i", й:"j", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r",
  с:"s", т:"t", у:"u", ф:"f", х:"kh", ц:"ts", ч:"ch", ш:"sh", щ:"sch",
  ъ:"", ы:"y", ь:"", э:"e", ю:"yu", я:"ya",
};

export function transliterate(str: string): string {
  return str
    .toLowerCase()
    .split("")
    .map((ch) => CYR_MAP[ch] ?? ch)
    .join("");
}

// ─── Fitness keyword dictionary RU → EN synonyms ─────────────────────────────
const FITNESS_DICT: Array<[RegExp, string[]]> = [
  [/жим/,            ["press", "bench", "push"]],
  [/присед|присяд/,  ["squat"]],
  [/тяга/,           ["deadlift", "row", "pull"]],
  [/подтяг/,         ["pull-up", "pullup", "chin"]],
  [/отжим/,          ["push-up", "pushup", "dip"]],
  [/выпад/,          ["lunge"]],
  [/скручива/,       ["crunch", "twist"]],
  [/планка/,         ["plank"]],
  [/разводк/,        ["fly", "flye", "lateral"]],
  [/подъём|подъем/,  ["raise", "curl", "lift"]],
  [/сгибан/,         ["curl", "flex"]],
  [/разгибан/,       ["extension", "extend"]],
  [/толчок/,         ["push", "press", "clean"]],
  [/рывок/,          ["snatch"]],
  [/махи|мах/,       ["swing", "raise", "kick"]],
  [/шраги/,          ["shrug"]],
  [/икры|икра/,      ["calf", "calves"]],
  [/ягодич/,         ["glute", "hip thrust"]],
  [/грудь|грудн/,    ["chest", "pec"]],
  [/спин/,           ["back", "row"]],
  [/плечи|плечо/,    ["shoulder", "delt"]],
  [/бицепс/,         ["bicep"]],
  [/трицепс/,        ["tricep"]],
  [/пресс/,          ["abs", "core", "crunch"]],
  [/ног[иа]/,        ["leg", "squat"]],
  [/гантел/,         ["dumbbell"]],
  [/штанг/,          ["barbell", "bar"]],
  [/блок/,           ["cable", "pulley"]],
  [/турник/,         ["pull-up", "bar"]],
  [/брусья/,         ["dip", "parallel"]],
];

/** Returns EN keywords to search for when input contains a RU fitness term */
function ruToEnKeywords(query: string): string[] {
  const q = query.toLowerCase();
  const keywords: string[] = [];
  for (const [pattern, synonyms] of FITNESS_DICT) {
    if (pattern.test(q)) keywords.push(...synonyms);
  }
  return keywords;
}

export function hasCyrillic(str: string): boolean {
  return /[а-яёА-ЯЁ]/.test(str);
}

/** Smart match: handles RU input via dict + transliteration fallback */
export function smartMatch(query: string, exerciseName: string): boolean {
  const name = exerciseName.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (!hasCyrillic(q)) {
    return name.includes(q);
  }

  // 1. Dictionary match (highest quality)
  const enKeywords = ruToEnKeywords(q);
  if (enKeywords.length > 0) {
    return enKeywords.some((kw) => name.includes(kw));
  }

  // 2. Transliteration fallback
  const translit = transliterate(q);
  return name.includes(translit);
}

