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
      className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-3xl">
        {tabs.map(({ href, label, Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold ${
              active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon size={22} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
