interface BadgeProps {
  label: string;
  variant?: "indigo" | "violet" | "emerald" | "amber" | "rose" | "slate";
}

const variantMap = {
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  slate: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default function Badge({ label, variant = "indigo" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantMap[variant]}`}
    >
      {label}
    </span>
  );
}
