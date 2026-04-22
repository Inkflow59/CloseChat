import { useState } from 'react'
import type { NavigateFn } from './pages/HomePage'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

export default function App() {
  type Route = 'home' | 'about' | 'login' | 'signup'

  const [route, setRoute] = useState<Route>('home')

  const navigate: NavigateFn = (next) => {
    setRoute(next)
  }

  if (route === 'login') {
    return <LoginPage navigate={navigate} />
  }

  if (route === 'home') {
    return <HomePage navigate={navigate} />
  }

  if (route === 'signup') {
    return <SignupPage navigate={navigate} />
  }

  return <AboutPage navigate={navigate} />
}