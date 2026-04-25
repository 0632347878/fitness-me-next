import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "strength" | "cardio" | "flexibility" | "mobility" | "active" | "done";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:     "bg-gray-100 text-gray-700",
  strength:    "bg-purple-100 text-purple-700",
  cardio:      "bg-red-100 text-red-700",
  flexibility: "bg-green-100 text-green-700",
  mobility:    "bg-blue-100 text-blue-700",
  active:      "bg-yellow-100 text-yellow-700",
  done:        "bg-emerald-100 text-emerald-700",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

