import { requireDesigner } from "@/lib/auth";
import { notificationsFor } from "@/lib/data";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireDesigner();
  return (
    <>
      <Sidebar name={me.name} alerts={await notificationsFor(me.id)} />
      <main className="ml-[228px] min-h-screen px-8 py-8 lg:px-10">{children}</main>
    </>
  );
}
