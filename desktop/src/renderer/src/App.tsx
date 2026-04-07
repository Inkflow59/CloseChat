import { useState } from 'react'
import type { NavigateFn } from './pages/HomePage'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'

export default function App() {
  type Route = 'home' | 'about'

  const [route, setRoute] = useState<Route>('home')

  const navigate: NavigateFn = (next) => {
    setRoute(next)
  }

  if (route === 'home') {
    return <HomePage navigate={navigate} />
  }

  return <AboutPage navigate={navigate} />
}