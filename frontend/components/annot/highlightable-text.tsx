"use client";

import React, { Fragment } from "react";

type Range = { id: string; start: number; end: number; resolved?: boolean };

type Props = {
  text: string;
  ranges: Range[];
  className?: string;
};

// Render text with <mark> around the specified ranges. Assumes ranges are within bounds.
const HighlightableText: React.FC<Props> = ({ text, ranges, className }) => {
  const len = text?.length ?? 0;
  const safeRanges = Array.isArray(ranges)
    ? [...ranges]
        .filter((r) => typeof r?.start === "number" && typeof r?.end === "number" && r.end > r.start)
        .map((r) => ({ ...r, start: Math.max(0, Math.min(len, r.start)), end: Math.max(0, Math.min(len, r.end)) }))
        .sort((a, b) => a.start - b.start)
    : [];

  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  safeRanges.forEach((r, idx) => {
    if (r.start > cursor) {
      pieces.push(<Fragment key={`t-${idx}-pre`}>{text.slice(cursor, r.start)}</Fragment>);
    }
    const marked = text.slice(r.start, r.end);
    pieces.push(
      <mark
        key={`m-${r.id}`}
        data-annot-ref={`ann-${r.id}`}
        className={`rounded-sm px-[2px] ${r.resolved ? "bg-green-100" : "bg-yellow-100"}`}
      >
        {marked}
      </mark>
    );
    cursor = r.end;
  });
  if (cursor < len) {
    pieces.push(<Fragment key={`t-tail`}>{text.slice(cursor)}</Fragment>);
  }

  return (
    <span className={className} style={{ whiteSpace: "pre-wrap" }}>
      {pieces}
    </span>
  );
};

export default HighlightableText;

