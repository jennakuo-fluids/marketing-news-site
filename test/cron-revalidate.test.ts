import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// revalidateTag requires Next's request-scoped store, which only exists
// inside a real running server — not in a bare Vitest environment. Mock it
// so the success path is testable; the auth-guard tests below don't touch
// it at all (they short-circuit before revalidateTag is called).
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const { POST } = await import("@/app/api/cron/revalidate/route");
const { revalidateTag } = await import("next/cache");

beforeEach(() => {
  process.env.CRON_SECRET = "secret-value";
  vi.mocked(revalidateTag).mockClear();
});

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/cron/revalidate", {
    method: "POST",
    headers,
  });
}

describe("POST /api/cron/revalidate", () => {
  it("rejects a missing secret header", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("rejects a wrong secret header", async () => {
    const res = await POST(makeRequest({ "x-cron-secret": "wrong" }));
    expect(res.status).toBe(401);
  });

  it("rejects when CRON_SECRET itself is unset (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(makeRequest({ "x-cron-secret": "" }));
    expect(res.status).toBe(401);
  });

  it("accepts the correct secret header and revalidates the ragic tag", async () => {
    const res = await POST(makeRequest({ "x-cron-secret": "secret-value" }));
    expect(res.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("ragic");
  });
});
