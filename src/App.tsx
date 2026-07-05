import './App.css'
import './prism-terminal.css'
import { Terminal } from './components/Terminal'
import { ThemeProvider } from './store/theme/context'
import { TerminalProvider } from './store/terminal/context'

function App() {
  return (
    <ThemeProvider>
      <TerminalProvider>
        <Terminal />
      </TerminalProvider>
    </ThemeProvider>
  )
}

export default App
