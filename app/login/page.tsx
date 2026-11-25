import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

async function signIn(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  const next = String(formData.get("next") ?? "");
  if (error) redirect("/login?error=1");
  // Only same-site /oauth/ paths, so this can't be used to bounce to another site.
  redirect(/^\/oauth\/[\w\/?=&%.-]*$/.test(next) ? next : "/");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex h-4 border-b-[3px] border-black" aria-hidden="true">
        {["#2F5BFF", "#00C853", "#FFC400", "#C04BFF"].map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <form action={signIn} aria-labelledby="t" className="flex w-full max-w-110 flex-col border-[3px] border-black">
          <input type="hidden" name="next" value={next ?? ""} />
          <h1 id="t" className="m-0 border-b-[3px] border-black p-6 text-[40px] leading-none font-bold tracking-tight uppercase">
            Tracker
          </h1>
          <div className="flex flex-col gap-3 p-6">
            <label htmlFor="email" className="text-xs font-bold">EMAIL</label>
            <input id="email" name="email" type="email" required autoComplete="username" className="min-h-12 w-full border-2 border-black px-3 text-[15px]" />
            <label htmlFor="pw" className="mt-2 text-xs font-bold">PASSWORD</label>
            <input id="pw" name="password" type="password" required autoComplete="current-password" className="min-h-12 w-full border-2 border-black px-3 text-[15px]" />
            {error && <p role="alert" className="m-0 text-sm font-bold">WRONG EMAIL OR PASSWORD</p>}
          </div>
          <button type="submit" className="min-h-15 cursor-pointer border-t-[3px] border-black bg-black text-base font-bold text-white uppercase">
            Sign in →
          </button>
        </form>
      </div>
    </div>
  );
}
