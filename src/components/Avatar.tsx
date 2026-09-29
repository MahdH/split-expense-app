export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-peach to-accent text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
