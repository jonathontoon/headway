interface FooterProps {
  wordCount: number
  charCount: number
  readingTime: number
}

function Footer({ wordCount, charCount, readingTime }: FooterProps) {
  return (
    <div className="flex shrink-0 gap-6 pt-1.5 px-4 pb-safe-or-1.5 bg-black border-t border-[#1a1a1a] font-departure text-xs text-[#444444] select-none">
      <span>{readingTime} min read</span>
      <span>{wordCount} words</span>
      <span>{charCount} characters</span>
    </div>
  )
}

export default Footer
