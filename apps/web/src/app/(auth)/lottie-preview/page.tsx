import ExerciseLottie from "@/components/ui/ExerciseLottie";
import s from "./page.module.css";

export default function LottiePreviewPage() {
  return (
    <main className={s.page}>
      <section className={s.card}>
        <div className={s.header}>
          <span className={s.eyebrow}>Exercise animation preview</span>
          <h1 className={s.title}>Floor Crunch</h1>
          <p className={s.copy}>Native vector Lottie · 512 × 512 · 30 fps</p>
        </div>
        <ExerciseLottie
          src="/exercises/lottie/floor-crunch.json?v=2"
          label="Floor crunch exercise animation"
          className={s.animation}
        />
      </section>
    </main>
  );
}
