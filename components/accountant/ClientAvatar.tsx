import { cn } from "@/lib/utils";

interface Props {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function ClientAvatar({ name, logoUrl, size = "sm" }: Props) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div className={cn("shrink-0 overflow-hidden rounded-full", sizes[size])}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center bg-nordic-600/10 font-medium text-nordic-600 dark:bg-nordic-600/20", sizes[size])}>
          {initial}
        </div>
      )}
    </div>
  );
}
