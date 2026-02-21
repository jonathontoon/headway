import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Button } from './components/Button'
import { useCounter } from './hooks/useCounter'

function App() {
  const { count, increment } = useCounter(0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="flex space-x-8 mb-8">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img
            src={viteLogo}
            className="h-24 p-6 hover:drop-shadow-[0_0_2em_#646cffaa] transition-all"
            alt="Vite logo"
          />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img
            src={reactLogo}
            className="h-24 p-6 hover:drop-shadow-[0_0_2em_#61dafbaa] transition-all animate-[spin_20s_linear_infinite]"
            alt="React logo"
          />
        </a>
      </div>
      <h1 className="text-5xl font-bold mb-8 text-gray-800 font-departure">
        Vite + React + Tailwind
      </h1>
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <Button onClick={increment} className="mb-4">
          count is {count}
        </Button>
        <p className="text-gray-600">
          Edit{' '}
          <code className="bg-gray-200 px-1 rounded text-sm">src/App.tsx</code>{' '}
          and save to test HMR
        </p>
      </div>
      <p className="mt-8 text-gray-500 italic">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
