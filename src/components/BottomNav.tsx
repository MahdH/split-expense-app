"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UsersIcon } from "@/components/icons";

export function BottomNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();
  const homeHref = `/g/${groupId}`;
  const membersHref = `/g/${groupId}/members`;

  const tabs = [
    { href: homeHref, label: "Home", Icon: HomeIcon, active: pathname === homeHref },
    {
      href: membersHref,
      label: "Members",
      Icon: UsersIcon,
      active: pathname.startsWith(membersHref),
    },
  ];

  return (
    <nav
      aria-label="Group sections"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-xl rounded-t-[28px] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-14px_32px_-16px_rgba(23,20,21,0.35)] backdrop-blur-xl"
    >
      <div className="flex px-6">
        {tabs.map(({ href, label, Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 pb-3 pt-3.5 text-xs transition-colors ${
              active ? "font-bold text-ink" : "font-semibold text-ink-3 hover:text-ink-2"
            }`}
          >
            <Icon size={24} strokeWidth={active ? 2.1 : 1.75} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
