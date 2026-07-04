import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('renders a terminal prompt', () => {
    render(<App />)
    expect(screen.getByLabelText('Terminal prompt')).toHaveTextContent(
      'headway@localhost:~$ start',
    )
  })
})
