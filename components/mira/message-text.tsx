"use client"

import { Fragment } from "react"
import { cn } from "@/lib/utils"

/**
 * Minimal markdown-ish renderer tuned for MIRA assistant messages.
 * Supports: **bold**, *italic*, `inline code`, - / • bullets, blank-line paragraphs.
 * Keeps bundle lean (no markdown dependency).
 */
export function MessageText({
  text,
  muted = false,
}: {
  text: string
  muted?: boolean
}) {
  if (!text) return null

  // Split into blocks by blank lines
  const blocks = text.split(/\n{2,}/)

  return (
    <div
      className={cn(
        "space-y-2 whitespace-pre-wrap break-words",
        muted && "[&_strong]:text-primary-foreground",
      )}
    >
      {blocks.map((block, bi) => {
        const lines = block.split("\n")
        const isList = lines.every((l) =>
          /^\s*(?:[-•*]|\d+\.)\s+/.test(l.trim()) && l.trim().length > 0,
        )
        if (isList && lines.length > 0) {
          return (
            <ul
              key={bi}
              className={cn(
                "space-y-1 pl-4",
                muted
                  ? "marker:text-primary-foreground/70"
                  : "marker:text-primary/70",
              )}
            >
              {lines.map((l, li) => (
                <li key={li} className="list-disc">
                  {renderInline(l.replace(/^\s*(?:[-•*]|\d+\.)\s+/, ""))}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={bi} className="leading-relaxed">
            {lines.map((l, li) => (
              <Fragment key={li}>
                {renderInline(l)}
                {li < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let lastIdx = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      out.push(text.slice(lastIdx, m.index))
    }
    const token = m[0]
    if (token.startsWith("**")) {
      out.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith("`")) {
      out.push(
        <code
          key={key++}
          className="rounded bg-black/5 px-1 py-0.5 font-mono text-[12px] dark:bg-white/10"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith("*")) {
      out.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    }
    lastIdx = m.index + token.length
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx))
  return out
}
