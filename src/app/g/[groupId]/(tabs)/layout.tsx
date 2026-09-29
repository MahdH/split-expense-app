import { BottomNav } from "@/components/BottomNav";

export default async function TabsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return (
    <>
      {children}
      <BottomNav groupId={groupId} />
    </>
  );
}
