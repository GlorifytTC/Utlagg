import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Label + Input pair for the public auth pages (light-surface: `dark:` variants still fire for dark-theme users, so they are neutralised with `!`). */
export function Field({
  id,
  label,
  error,
  ...props
}: { id: string; label: string; error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1 block dark:!text-gray-700">{label}</Label>
      <Input
        id={id}
        className="dark:!border-gray-900/15 dark:!bg-white dark:!text-gray-900 dark:placeholder:!text-gray-500"
        aria-invalid={error || undefined}
        aria-describedby={error ? "form-error" : undefined}
        {...props}
      />
    </div>
  );
}
