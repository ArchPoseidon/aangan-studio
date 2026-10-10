import { listDesigners } from "@/lib/data";
import { currentDesigner } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function Login() {
  if (await currentDesigner()) redirect("/dashboard");
  const designers = await listDesigners();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/projects/flat-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-md text-ivory">
          <div className="font-serif text-[34px] leading-tight">More than a CRM.<br />Your design studio, organised.</div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="font-serif text-[34px] leading-none">Aangan</div>
          <div className="mb-10 mt-1 text-[10px] font-semibold uppercase tracking-[.28em] text-mute">Studio · Pune</div>
          <LoginForm names={designers.map((d) => d.name)} />
        </div>
      </div>
    </div>
  );
}
