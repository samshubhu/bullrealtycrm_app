import { cn, initials, colorFromString } from "@/lib/utils";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        colorFromString(name || "?"),
        sizes[size],
        className,
      )}
      title={name || undefined}
    >
      {initials(name)}
    </span>
  );
}
