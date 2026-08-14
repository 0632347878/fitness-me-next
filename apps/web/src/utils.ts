// ─────────────────────────────────────────────────────────────────────────────
// Локальные картинки в /public/exercises для упражнений, которым мы подменяем
// источник (сняли сами / заменили внешний).
//
// Ключ — КАНОНИЧЕСКОЕ name упражнения (то же, по которому сидится/апсертится
// база), а не cuid: id пересоздаётся на каждом db:seed и ломает соответствие,
// а name стабилен и совпадает с именем файла в public.
//
// В public лежат два кадра: <slug>-0.png (старт) и <slug>-1.png (финиш).
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_GIF_BY_NAME: Record<string, string> = {
    "DB Superman": "/exercises/DB-superman-0.png",
};

// Native vector overrides. Keep aliases explicit: a generic substring match would
// accidentally show a floor crunch for cable, machine, or reverse-crunch variants.
const LOCAL_LOTTIE_BY_NAME: Record<string, string> = {
    "abdominal crunch": "/exercises/lottie/floor-crunch.json?v=2",
    "bodyweight crunch": "/exercises/lottie/floor-crunch.json?v=2",
    "crunch": "/exercises/lottie/floor-crunch.json?v=2",
    "floor crunch": "/exercises/lottie/floor-crunch.json?v=2",
    "floor sit-up": "/exercises/lottie/floor-crunch.json?v=2",
    "sit up": "/exercises/lottie/floor-crunch.json?v=2",
    "sit-up": "/exercises/lottie/floor-crunch.json?v=2",
};

export const localLottieUrl = (name?: string | null): string | null => {
    if (!name) return null;
    return LOCAL_LOTTIE_BY_NAME[name.trim().toLowerCase()] ?? null;
};

const NO_IMG = "/no-img.jpg";

/** Есть ли у упражнения локальная картинка в /public (по name). */
export const hasLocalGif = (name?: string | null): boolean =>
    !!name && name in LOCAL_GIF_BY_NAME;

// Финишный кадр распознаём и у remote (.../1.jpg), и у локальных (…-1.png).
const isFinishFrame = (src: string): boolean =>
    /\/1\.jpg$/i.test(src) || /-1\.(png|jpe?g|webp|gif)$/i.test(src);

const gifUrl = (src: string | null, name?: string | null): string | null => {
    // 1. Локальный override по name — приоритетнее всего. Если для упражнения
    //    есть картинка в /public/exercises, отдаём её (даже если в БД gifUrl
    //    указывает на remote или пуст). Кадр старт/финиш выбираем по src.
    const local = name ? LOCAL_GIF_BY_NAME[name] : undefined;
    if (local) {
        return src && isFinishFrame(src)
            ? local.replace(/-0(\.\w+)$/i, "-1$1")
            : local;
    }

    if (!src) return NO_IMG;
    if (src.startsWith("/")) return src;                // уже локальный путь → как есть

    return `/api/gif?url=${encodeURIComponent(src)}`;   // remote → через прокси-кэш (свой долгий кэш)
};

// free-exercise-db хранит два кадра: .../<Exercise>/0.jpg (старт) и /1.jpg (финиш).
// Финиш выводится из старта заменой индекса — отдельно нигде не хранится.
// Поддерживаем оба соглашения об именах: remote /0.jpg и локальные …-0.png.
export const finishFrame = (src: string | null): string | null => {
    if (!src) return null;
    if (/\/0\.jpg$/i.test(src)) return src.replace(/\/0\.jpg$/i, "/1.jpg");
    if (/-0\.(png|jpe?g|webp|gif)$/i.test(src)) return src.replace(/-0(\.\w+)$/i, "-1$1");
    return null;
};

export default gifUrl;
