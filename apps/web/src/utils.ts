const gifUrl = (src: string | null): string | null => {
    const noImg = "/no-img.jpg";

    if (!src) return noImg;
    if (src.startsWith("/")) return src; // already local → serve directly
    return `/api/gif?url=${encodeURIComponent(src)}`; // remote → прокси (там ставим свой долгий кэш)
}

// free-exercise-db хранит два кадра: .../<Exercise>/0.jpg (старт) и /1.jpg (финиш).
// Финиш выводится из старта заменой индекса — отдельно нигде не хранится.
// Для других источников (локальные, свои съёмки) второго кадра нет → null.
export const finishFrame = (src: string | null): string | null => {
    if (!src) return null;
    return /\/0\.jpg$/i.test(src) ? src.replace(/\/0\.jpg$/i, "/1.jpg") : null;
};

export default gifUrl;