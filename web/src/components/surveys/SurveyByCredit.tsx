import { resolveSurveyBy } from "@/lib/campaign-survey-by";

export function SurveyByCredit({
  name,
  compact = false,
  className = "",
}: {
  name?: string | null;
  compact?: boolean;
  className?: string;
}) {
  const by = resolveSurveyBy(name);

  return (
    <p
      className={`text-zinc-600 dark:text-zinc-400 ${compact ? "text-[11px]" : "text-sm"} ${className}`.trim()}
    >
      Survey by: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{by}</span>
    </p>
  );
}
