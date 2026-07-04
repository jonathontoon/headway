import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders get started heading', () => {
    render(<App />)
    expect(screen.getByText(/Get started/i)).toBeInTheDocument()
  })

  it('increments the count on button click', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /count is 0/i })
    expect(button).toBeInTheDocument()
    fireEvent.click(button)
    expect(
      screen.getByRole('button', { name: /count is 1/i }),
    ).toBeInTheDocument()
  })
})
