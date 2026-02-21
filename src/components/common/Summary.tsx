import Span from "@base/Span.tsx";
import Footer from "@base/Footer.tsx";

interface SummaryProps {
  wordCount: number;
  charCount: number;
}

const Summary = ({ wordCount, charCount }: SummaryProps) => {
  const getReadingTimeLabel = () => {
    if (wordCount === 0) return "Less than 1 min read";
    if (wordCount < 200) return "Less than 1 min read";
    const minutes = Math.ceil(wordCount / 200);
    return `About ${minutes} min read`;
  };

  return (
    <Footer className="flex flex-row shrink-0 gap-6 py-1.5 px-9 pb-safe-or-1.5 bg-black border-t border-[#1a1a1a] font-departure text-xs text-[#444444] select-none">
      <Span>{getReadingTimeLabel()}</Span>
      <Span>{wordCount} words</Span>
      <Span>{charCount} characters</Span>
    </Footer>
  );
};

export default Summary;
