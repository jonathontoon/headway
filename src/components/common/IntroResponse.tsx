import Div from "../base/Div.tsx"
import Paragraph from "../base/Paragraph.tsx"
import Link from "../base/Link.tsx"

import Hint from "../common/Hint.tsx"
import Response from "../common/Response.tsx"

const IntroResponse = () => {
  return (
    <Response className="py-4">
      <Div className="flex flex-col gap-4">
        <Paragraph>
          Welcome to Encrypt Any File — a local-first tool for keeping files
          private and secure, right from your browser.
        </Paragraph>
        <Paragraph>
          No signups, no cloud storage, no nonsense. Just add a file, set a
          password, export and you're done. All data stays right here in your
          browser tab where they belong, using the same battle-tested encryption
          that banks use.
        </Paragraph>
        <Paragraph>
          I built this because everyone deserves privacy, not just tech experts.
          It's free and open-source forever. If you find it useful, consider{" "}
          <Link
            href="https://github.com/sponsors/jonathontoon"
            className="text-yellow-200"
          >
            buying me a coffee
          </Link>
          .
        </Paragraph>
        <Hint>Type 'help' to see available commands.</Hint>
      </Div>
    </Response>
  )
}

export default IntroResponse
