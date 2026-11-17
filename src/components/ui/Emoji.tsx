import { memo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isEmojiOnly } from '@/lib/emoji'

/** One emoji, drawn with the phone's own (default) emoji font. */
export const Emoji = memo(function Emoji({ value }: { value: string }) {
  return <span className="emoji-native">{value}</span>
})

const TOKEN_RE = /(@[A-Za-z0-9_]{3,20}|https?:\/\/[^\s<]+)/g

function renderEmojiText(text: string, keyPrefix: string): ReactNode[] {
  return [<span key={keyPrefix}>{text}</span>]
}

/**
 * Renders user text with consistent emoji, clickable @mentions and safe links.
 * Never uses dangerouslySetInnerHTML; all output is React text nodes.
 */
export const RichText = memo(function RichText({ text, className, jumbo = false, plain = false }: { text: string; className?: string; jumbo?: boolean; plain?: boolean }) {
  const parts = text.split(TOKEN_RE)
  // Messages made of 1-3 emoji and nothing else are shown larger (chat apps do the same).
  const big = jumbo && isEmojiOnly(text, 3)
  return (
    <span className={`pre-wrap ${big ? 'rich--jumbo' : ''} ${className ?? ''}`}>
      {parts.map((part, i) => {
        if (!part) return null
        // `plain` is used inside rows that are already links: nested <a> elements are invalid HTML.
        if (plain && (part.startsWith('@') || /^https?:\/\//.test(part))) return <span key={i}>{part}</span>
        if (part.startsWith('@') && /^@[A-Za-z0-9_]{3,20}$/.test(part)) {
          return (
            <Link key={i} to={`/u/${part.slice(1)}`}>
              {part}
            </Link>
          )
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">
              {part}
            </a>
          )
        }
        return <span key={i}>{renderEmojiText(part, String(i))}</span>
      })}
    </span>
  )
})
