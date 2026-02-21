import Span from "@base/Span.tsx";
import Footer from "@base/Footer.tsx";

interface SummaryProps {
  wordCount: number
  charCount: number
  readingTime: number
}

function Summary({ wordCount, charCount, readingTime }: SummaryProps) {
  return (
    <Footer className="flex shrink-0 gap-6 pt-1.5 px-4 pb-safe-or-1.5 bg-black border-t border-[#1a1a1a] font-departure text-xs text-[#444444] select-none">
      <Span>{readingTime} min read</Span>
      <Span>{wordCount} words</Span>
      <Span>{charCount} characters</Span>
    </Footer>
  )
}

export default Summary;
