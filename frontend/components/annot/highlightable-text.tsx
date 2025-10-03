"use client";

import React, { Fragment } from "react";

type Range = { id: string; start: number; end: number; resolved?: boolean };

type Props = {
  text: string;
  ranges: Range[];
  className?: string;
  colorMap?: Record<string, string>; // annotationId -> color (hex or rgba)
  indexMap?: Record<string, number>; // annotationId -> 1-based index
  // When true, render ranges with a marker-like background instead of underline
  marker?: boolean;
  // When provided, only ranges whose id is in this set render as markers
  markerIds?: Array<string> | Set<string>;
};

// Render text with <mark> around the specified ranges. Assumes ranges are within bounds.
const toRGBA = (c?: string, alpha = 1) => {
  if (!c) return `rgba(229,166,166,${alpha})`;
  if (c.startsWith('rgba') || c.startsWith('rgb')) return c;
  // hex #RRGGBB
  const m = c.replace('#','');
  const r = parseInt(m.substring(0,2),16);
  const g = parseInt(m.substring(2,4),16);
  const b = parseInt(m.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const HighlightableText: React.FC<Props> = ({ text, ranges, className, colorMap = {}, indexMap = {}, marker = false, markerIds }) => {
  const len = text?.length ?? 0;
  const safeRanges = Array.isArray(ranges)
    ? [...ranges]
        .filter((r) => typeof r?.start === "number" && typeof r?.end === "number" && r.end > r.start)
        .map((r) => ({ ...r, start: Math.max(0, Math.min(len, r.start)), end: Math.max(0, Math.min(len, r.end)) }))
        .sort((a, b) => a.start - b.start)
    : [];

  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  const markerIdSet: Set<string> | null = (() => {
    if (!markerIds) return null;
    return markerIds instanceof Set ? markerIds : new Set(markerIds);
  })();
  // NOTE: When ranges overlap, naive slicing duplicates text.
  // To prevent that, clip each range to start at least from `cursor` and
  // skip fully-covered ranges.
  safeRanges.forEach((r, idx) => {
    const start = Math.max(cursor, r.start);
    const end = Math.max(start, r.end);

    if (start > cursor) {
      pieces.push(<Fragment key={`t-${idx}-pre`}>{text.slice(cursor, start)}</Fragment>);
    }
    if (end > start) {
      const marked = text.slice(start, end);
      const baseColor = colorMap[r.id];
      const underline = r.resolved ? toRGBA(baseColor, 0.35) : toRGBA(baseColor, 0.85);
      const highlightBg = r.resolved ? toRGBA(baseColor, 0.14) : toRGBA(baseColor, 0.24);
      const badgeIdx = indexMap[r.id];
      const isMarked = markerIdSet ? markerIdSet.has(String(r.id)) : marker;
      pieces.push(
        <mark
          key={`m-${r.id}-${start}`}
          data-annot-ref={`ann-${r.id}`}
          className={`px-[1px]`}
          style={isMarked
            ? { backgroundColor: highlightBg }
            : { backgroundColor: 'transparent', boxShadow: `inset 0 -2px 0 ${underline}` }
          }
        >
          {marked}
          {typeof badgeIdx === 'number' && (
            <sup
              className="ml-1 inline-flex items-center justify-center align-super text-[10px] leading-[10px] rounded-sm px-[4px] py-[1px]"
              style={{ background: toRGBA(baseColor, 0.15), color: baseColor, border: `1px solid ${toRGBA(baseColor, 0.7)}` }}
            >
              {badgeIdx}
            </sup>
          )}
        </mark>
      );
      cursor = end;
    }
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
