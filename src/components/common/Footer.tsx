interface FooterProps {
  wordCount: number
  charCount: number
  readingTime: number
}

function Footer({ wordCount, charCount, readingTime }: FooterProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        padding: "6px 16px calc(6px + env(safe-area-inset-bottom))",
        background: "#000000",
        borderTop: "1px solid #1a1a1a",
        fontFamily: "'Departure Mono', monospace",
        fontSize: "12px",
        color: "#444444",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <span>{readingTime} min read</span>
      <span>{wordCount} words</span>
      <span>{charCount} characters</span>
    </div>
  )
}

export default Footer
