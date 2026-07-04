import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders an editable terminal prompt', () => {
    render(<App />)
    expect(screen.getByLabelText('Terminal prompt')).toBeInTheDocument()
    expect(screen.getByLabelText('Terminal command')).toHaveFocus()
  })

  it('runs JavaScript expressions', () => {
    render(<App />)
    const input = screen.getByLabelText('Terminal command')

    fireEvent.change(input, { target: { value: '1 + 1' } })
    fireEvent.submit(input.closest('form')!)

    expect(screen.getAllByText('headway@localhost:~$')).toHaveLength(2)
    expect(screen.getByText('1 + 1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('clears terminal entries', () => {
    render(<App />)
    const input = screen.getByLabelText('Terminal command')
    const form = input.closest('form')!

    fireEvent.change(input, { target: { value: 'echo hello' } })
    fireEvent.submit(form)
    expect(screen.getByText('hello')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'clear' } })
    fireEvent.submit(form)
    expect(screen.queryByText('hello')).not.toBeInTheDocument()
  })
})
