import { ShieldCheck } from "lucide-react";
import { PRIVACY_NOTICE } from "@/constants/upload";
import { cn } from "@/utils/utils";

interface PrivacyNoticeProps {
  className?: string;
}

export function PrivacyNotice({ className }: PrivacyNoticeProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2.5 text-center", className)}>
      <ShieldCheck className="h-4 w-4 shrink-0 text-success" strokeWidth={1.6} aria-hidden="true" />
      <p className="text-xs text-ink-muted">{PRIVACY_NOTICE}</p>
    </div>
  );
}
