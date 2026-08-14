import type {Exercise} from "@/features/exercises/exercises.api";
import s from "@/app/(app)/exercises/page.module.css";
import {FmBadge} from "@/components/fm";
import MuscleChip from "@/components/ui/MuscleChip";
import ExerciseGif from "@/components/ui/ExerciseGif";
import ExerciseLottie from "@/components/ui/ExerciseLottie";
import { hasLocalGif, localLottieUrl } from "@/utils";

const ExerciseCard = ({ ex, lang, onClick }: { ex: Exercise; lang: string; onClick: () => void })=> {
    const displayName = lang === "ru" ? (ex.nameRu ?? ex.name) : ex.name;
    const lottieSrc = localLottieUrl(ex.name);
    return (
        <button className={s.card} onClick={onClick}>
            <div className={s.cardTop}>
                <span className={s.cardName}>{displayName}</span>
                <FmBadge cat={ex.category} />
            </div>
            <div className={s.cardMuscles}>
                {ex.muscleGroups.slice(0, 3).map((m) => <MuscleChip key={m} label={m} />)}
                {ex.muscleGroups.length > 3 && (
                    <span className={s.cardMore}>+{ex.muscleGroups.length - 3}</span>
                )}
            </div>
            {ex.equipment && (
                <span className={s.cardEquipment}>🏋️ {ex.equipment}</span>
            )}
            {(lottieSrc || ex.gifUrl || hasLocalGif(ex.name)) && (
                <div className={s.exerciseCardWrapper}>
                    {lottieSrc ? (
                        <ExerciseLottie className={s.cardGif} src={lottieSrc} label={displayName} />
                    ) : (
                        <ExerciseGif
                            className={s.cardGif}
                            src={ex.gifUrl}
                            alt={displayName}
                            name={ex.name}
                        />
                    )}
                </div>
            )}
        </button>
    );
}

export default ExerciseCard;
