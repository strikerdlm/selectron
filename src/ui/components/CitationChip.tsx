// src/ui/components/CitationChip.tsx
// Compact inline chip that renders a single citation.
// Shows: authors + year, doi link, scite verification badge, relevance quote (on hover/expand).
// Never hardcodes citation text — always consumes a Citation object from citationsFor().

import { useState } from "react";
import type { Citation } from "../../data/citations";

interface CitationChipProps {
  citation: Citation;
  /** If true, shows the relevance_quote below the chip (expanded state). */
  expanded?: boolean;
}

export function CitationChip({ citation, expanded = false }: CitationChipProps) {
  const [showQuote, setShowQuote] = useState(expanded);

  const hasDoi = citation.doi && !citation.doi.startsWith("no-doi");
  const isVerified = citation.scite_verified && citation.retraction_status === "none";
  const isRetracted = citation.retraction_status === "retracted";
  const isConcern = citation.retraction_status === "expression-of-concern";

  return (
    <div
      className="mono text-[10px] leading-snug"
      style={{ color: isRetracted ? "var(--warn)" : "var(--ink-2)" }}
    >
      <div className="flex items-baseline gap-1.5 flex-wrap">
        {/* Authors + year */}
        <span className="text-ink-1 font-medium">
          {citation.authors} ({citation.year})
        </span>

        {/* DOI link */}
        {hasDoi && (
          <a
            href={`https://doi.org/${citation.doi}`}
            target="_blank"
            rel="noreferrer"
            className="text-[9px] uppercase tracking-cap transition-colors hover:text-signal"
            style={{ color: "var(--ink-3)" }}
            title={`DOI: ${citation.doi}`}
          >
            ↗ doi
          </a>
        )}

        {/* Scite verified badge */}
        {isVerified && (
          <span
            className="text-[9px] uppercase tracking-cap px-1 rounded-full border"
            style={{ color: "var(--go)", borderColor: "var(--go)", background: "rgba(86,214,160,0.06)" }}
            title="Scite-verified: no retractions or concerns"
          >
            ✓ scite
          </span>
        )}

        {/* Retraction warning */}
        {isRetracted && (
          <span
            className="text-[9px] uppercase tracking-cap px-1 rounded-full border"
            style={{ color: "var(--warn)", borderColor: "var(--warn)", background: "rgba(255,107,94,0.08)" }}
          >
            ⚠ retracted
          </span>
        )}

        {/* Expression of concern */}
        {isConcern && (
          <span
            className="text-[9px] uppercase tracking-cap px-1 rounded-full border"
            style={{ color: "var(--signal)", borderColor: "var(--signal)", background: "rgba(245,181,65,0.08)" }}
          >
            ⚠ concern
          </span>
        )}

        {/* Citation count */}
        {typeof citation.smart_citation_count === "number" && (
          <span className="text-[9px] text-ink-3" title="Scite smart citation count">
            {citation.smart_citation_count.toLocaleString()} cit.
          </span>
        )}

        {/* Quote toggle button */}
        {citation.relevance_quote && (
          <button
            type="button"
            className="text-[9px] uppercase tracking-cap transition-colors hover:text-signal"
            style={{ color: "var(--ink-3)" }}
            onClick={() => setShowQuote((v) => !v)}
            aria-expanded={showQuote}
            aria-label="toggle relevance quote"
          >
            {showQuote ? "▴ quote" : "▾ quote"}
          </button>
        )}
      </div>

      {/* Title (truncated) */}
      <div className="text-[9px] text-ink-3 truncate max-w-xs mt-0.5" title={citation.title}>
        {citation.title}
      </div>

      {/* Relevance quote (expanded) */}
      {showQuote && citation.relevance_quote && (
        <div
          className="mt-1.5 px-2 py-1 rounded border-l-2 text-[9px] text-ink-2 italic"
          style={{ borderColor: "var(--signal)", background: "rgba(245,181,65,0.04)" }}
        >
          "{citation.relevance_quote}"
        </div>
      )}
    </div>
  );
}
