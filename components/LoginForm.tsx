"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ names }: { names: string[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function pick(v: string) {
    setName(v); setErr(""); setHasPin(null);
    if (!names.includes(v)) return;
    const r = await fetch("/api/auth/status", { method: "POST", body: JSON.stringify({ name: v }) });
    if (r.ok) setHasPin((await r.json()).hasPin);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (hasPin === false && pin !== pin2) return setErr("The two PINs don't match");
    if (hasPin === false && !saved) return setErr("Please confirm you've saved your PIN");
    setBusy(true);
    const r = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify({ name, pin }) });
    setBusy(false);
    if (!r.ok) return setErr((await r.json()).error);
    router.push("/dashboard"); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="who">Your name</label>
        <input id="who" list="designers" className="field mt-1" placeholder="Start typing your name…" value={name} autoComplete="off"
          onChange={(e) => pick(e.target.value)} />
        <datalist id="designers">{names.map((n) => <option key={n} value={n} />)}</datalist>
      </div>
      {hasPin !== null && (
        <div className="fade-enter space-y-4">
          <div>
            <label className="label" htmlFor="pin">{hasPin ? "PIN" : "Create a PIN (4–8 digits)"}</label>
            <input id="pin" type="password" inputMode="numeric" className="field mt-1 tracking-[.3em]" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} autoFocus />
          </div>
          {!hasPin && (
            <>
              <div>
                <label className="label" htmlFor="pin2">Confirm PIN</label>
                <input id="pin2" type="password" inputMode="numeric" className="field mt-1 tracking-[.3em]" value={pin2} onChange={(e) => setPin2(e.target.value.replace(/\D/g, ""))} />
              </div>
              <label className="flex items-start gap-2 rounded-lg bg-[#F1E8CB]/70 p-3 text-[13px]">
                <input type="checkbox" className="mt-0.5" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
                <span>First time here. Save this PIN somewhere safe; you&apos;ll need it to sign in next time.</span>
              </label>
            </>
          )}
          <button className="btn-primary w-full" disabled={busy || pin.length < 4}>{hasPin ? "Sign in" : "Create PIN & sign in"}</button>
        </div>
      )}
      {err && <p className="text-[13px] text-oxblood">{err}</p>}
    </form>
  );
}
