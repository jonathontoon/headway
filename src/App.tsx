import { Fragment } from "react"
import Div from "./components/base/Div"
import Section from "./components/base/Section"
import Span from "./components/base/Span"
import LoadingResponse from "./components/common/LoadingResponse"
import MainApp from "./pages/MainApp.tsx";

function App() {
  return (
    <Fragment>
      {/* <Div id="loading-state">
        <Section className="flex flex-col-reverse p-4 scroll-smooth">
          <Span id="loading-response">
            <LoadingResponse />
          </Span>
        </Section>
      </Div> */}
      <MainApp />
    </Fragment>
  )
}

export default App
