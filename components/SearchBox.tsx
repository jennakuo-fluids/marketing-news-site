"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildFilterUrl, parseParams, toSearchParams } from "@/lib/news";
import { SearchIcon } from "./icons";

type Props = {
  id: string;
  className: string;
  placeholder: string;
  showButton?: boolean;
};

// Submitting from /search keeps current filters, replaces q, drops page.
// Submitting from anywhere else goes to /search?q=... fresh. See handover §8.
export function SearchBox({ id, className, placeholder, showButton = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = parseParams(searchParams);
  const [value, setValue] = useState(current.q);

  useEffect(() => {
    setValue(current.q);
  }, [current.q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    const next =
      pathname === "/search" ? buildFilterUrl(current, { q }) : toSearchParams({ q });
    router.push(`/search?${next.toString()}`);
  }

  return (
    <form role="search" className={className} onSubmit={submit}>
      <SearchIcon />
      <label htmlFor={id} className="visually-hidden">
        搜尋新聞
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      {showButton && (
        <button type="submit" className="btn">
          搜尋
        </button>
      )}
    </form>
  );
}
