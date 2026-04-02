"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getServiceIconUrl } from "@/lib/service-icons";

type Props = {
  projectCode: string;
  projectTitle: string;
  size?: number;
  className?: string;
};

export function ServiceIcon({ projectCode, projectTitle, size = 36, className }: Props) {
  const [failed, setFailed] = useState(false);
  const url = getServiceIconUrl(projectCode, projectTitle);

  if (failed || !url) {
    const initials = projectTitle
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-slate-100 to-slate-200 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200/80",
          className
        )}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-slate-200/80", className)}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
