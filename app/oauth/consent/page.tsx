import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function decide(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!isAllowedEmail(auth.user?.email)) redirect("/oauth/consent?id=" + encodeURIComponent(id));
  const { data, error } = approve
    ? await supabase.auth.oauth.approveAuthorization(id, { skipBrowserRedirect: true })
    : await supabase.auth.oauth.denyAuthorization(id, { skipBrowserRedirect: true });
  if (error || !data) redirect("/oauth/consent?id=" + encodeURIComponent(id));
  redirect(data.redirect_url);
}

export default async function Consent({ searchParams }: { searchParams: Promise<{ authorization_id?: string; id?: string }> }) {
  const sp = await searchParams;
  const id = sp.authorization_id ?? sp.id ?? "";
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email;

  let body: React.ReactNode;
  if (!id) {
    body = <p className="m-0 p-6 text-sm font-bold">MISSING REQUEST</p>;
  } else if (!isAllowedEmail(email)) {
    body = <p role="alert" className="m-0 p-6 text-sm font-bold">THIS ACCOUNT ({email}) IS NOT ALLOWED TO CONNECT.</p>;
  } else {
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error || !data) {
      body = <p role="alert" className="m-0 p-6 text-sm font-bold">THIS REQUEST IS INVALID OR EXPIRED.</p>;
    } else if (!("authorization_id" in data)) {
      redirect(data.redirect_url); // already approved
    } else {
      body = (
        <form action={decide} className="flex flex-col">
          <input type="hidden" name="id" value={id} />
          <p className="m-0 p-6 text-[15px]">
            <strong>{data.client.name}</strong> wants to read and change your goals and activities as {email}.
          </p>
          <div className="flex border-t-[3px] border-black">
            <button name="decision" value="deny" className="min-h-15 flex-1 cursor-pointer border-r-[3px] border-black bg-white text-base font-bold uppercase">Deny</button>
            <button name="decision" value="approve" className="min-h-15 flex-1 cursor-pointer bg-black text-base font-bold text-white uppercase">Allow →</button>
          </div>
        </form>
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-110 border-[3px] border-black">
        <h1 className="m-0 border-b-[3px] border-black p-6 text-[32px] leading-none font-bold tracking-tight uppercase">Connect to Tracker</h1>
        {body}
      </div>
    </div>
  );
}
