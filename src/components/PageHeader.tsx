import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";

export function PageHeader({
  backHref,
  title,
  subtitle,
}: {
  backHref: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center gap-3">
      <Link href={backHref} transitionTypes={["nav-back"]} aria-label="Back" className="icon-btn shrink-0">
        <ArrowLeftIcon size={20} />
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-ink-2">{subtitle}</p>}
      </div>
    </header>
  );
}
