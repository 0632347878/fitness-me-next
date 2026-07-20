import s from "@/app/(app)/exercises/page.module.css";

const MuscleChip = ({ label }: { label: string })=> {
    return <span className={s.chip}>{label}</span>;
}

export default MuscleChip;