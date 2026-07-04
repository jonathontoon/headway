import './App.css'

function App() {
  return (
    <main className="terminal" aria-label="Terminal prompt">
      <p className="terminal-line">
        <span className="prompt">headway@localhost:~$</span>
        <span className="command"> start</span>
        <span className="cursor" aria-hidden="true"></span>
      </p>
    </main>
  )
}

export default App
