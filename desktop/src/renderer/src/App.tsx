import { useState } from 'react'
import type { NavigateFn } from './pages/HomePage'
import HomePage from './pages/HomePage'

export default function App() {
  type Route = 'home'

  const [route, setRoute] = useState<Route>('home')

  const navigate: NavigateFn = (next) => {
    setRoute(next)
  }

  if (route === 'home') {
    return <HomePage navigate={navigate} />
  }

  return (
    <div className="min-h-screen bg-[#fdf7f2]" />
  )
}