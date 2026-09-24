import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, safeReturnTo, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifyPassword } from "@/lib/session";

// Short server-side delay on a wrong password (handover §15) — a basic
// throttle since there's no shared store to track attempts across requests
// on Hobby/serverless.
const WRONG_PASSWORD_DELAY_MS = 700;

type SignInPageProps = {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const wrongPassword = params.error === "1";

  async function action(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    const ok = await verifyPassword(password);

    if (!ok) {
      await new Promise((resolve) => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
      redirect(`/signin?returnTo=${encodeURIComponent(returnTo)}&error=1`);
    }

    const token = await createSessionToken();
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });
    redirect(returnTo);
  }

  return (
    <main className="signin-page">
      <div className="signin-card">
        <h1>富迪斯 產業新聞庫</h1>
        <p>請輸入密碼以繼續</p>
        {wrongPassword && <div className="signin-error">密碼錯誤，請再試一次。</div>}
        <form action={action}>
          <label htmlFor="password" className="visually-hidden">
            密碼
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            style={{
              width: "100%",
              height: 44,
              marginBottom: 16,
              border: "1px solid var(--border2)",
              borderRadius: 8,
              padding: "0 12px",
              background: "var(--bg)",
              color: "var(--text)",
            }}
          />
          <button type="submit" className="signin-btn">
            登入
          </button>
        </form>
      </div>
    </main>
  );
}
