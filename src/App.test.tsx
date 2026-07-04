import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders the REPL terminal prototype', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /Headway Terminal/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/REPL store mounted/i)).toBeInTheDocument()
  })

  it('dispatches commands through the reducer store', () => {
    render(<App />)
    const input = screen.getByLabelText(/command/i)

    fireEvent.change(input, { target: { value: 'set theme neon' } })
    fireEvent.click(screen.getByRole('button', { name: /run/i }))

    expect(screen.getByText(/Stored theme=neon/i)).toBeInTheDocument()
    expect(screen.getByText(/1 actions/i)).toBeInTheDocument()
  })

  it('clears history with a store action', () => {
    render(<App />)

    fireEvent.click(
      screen.getByRole('button', { name: /dispatch clear action/i }),
    )

    expect(screen.getByText(/History cleared/i)).toBeInTheDocument()
    expect(screen.queryByText(/REPL store mounted/i)).not.toBeInTheDocument()
  })
})
