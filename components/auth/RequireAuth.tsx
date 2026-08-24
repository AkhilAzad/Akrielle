"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { FlowHeader } from "@/components/layout/FlowHeader";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side route guard for pages that require a signed-in user.
 *
 * Access is decided entirely by the Supabase Auth state exposed through
 * AuthContext (`status`, derived from the restored + refreshed Supabase
 * session and its Supabase Auth user id) — never by reading the persisted
 * session out of localStorage directly, so a stale or tampered local value
 * can't grant entry on its own. AuthContext restores that session when the
 * app starts, so on a fresh load `status` is briefly "initializing"; during
 * that window we show a calm loader rather than flashing protected content or
 * bouncing a user who is in fact signed in.
 *
 * Once restoration settles: a signed-in user sees the page; a signed-out
 * visitor is redirected to /signin, with the route they attempted preserved
 * as `?next=` so they land back here after authenticating with Google.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "signed-out") {
      const next = pathname && pathname.startsWith("/") ? pathname : "/";
      router.replace(`/signin?next=${encodeURIComponent(next)}`);
    }
  }, [status, pathname, router]);

  if (status === "signed-in") {
    return <>{children}</>;
  }

  // "initializing" (session still restoring) or "signed-out" (mid-redirect):
  // a quiet, on-brand loading state consistent with the rest of the flow.
  return (
    <>
      <FlowHeader backHref="/" />
      <main className="py-24 md:py-32">
        <Container className="flex flex-col items-center gap-4 text-center">
          <Loader2
            className="h-8 w-8 animate-spin text-gold-deep"
            aria-hidden="true"
          />
          <p className="font-body text-[15px] text-ink-muted">Loading…</p>
        </Container>
      </main>
    </>
  );
}
