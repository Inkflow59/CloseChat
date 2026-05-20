import { useState } from 'react'
import type { NavigateFn, Route } from './pages/HomePage'
import type { Room } from './vite-env'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DiscoveryPage from './pages/DiscoveryPage'
import CreateRoomPage from './pages/CreateRoomPage'
import RoomListPage from './pages/RoomListPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  const [route, setRoute] = useState<Route>('home')
  const [roomsData, setRoomsData] = useState<{ rooms: Room[]; localIP: string }>({
    rooms: [],
    localIP: '',
  })
  const [user, setUser] = useState({ username: '', token: '' })
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null)

  const navigate: NavigateFn = (next, data?) => {
    const d = data as Record<string, unknown> | undefined
    if (d) {
      if ('rooms' in d || 'localIP' in d) {
        setRoomsData((prev) => ({
          rooms: (d.rooms as Room[]) ?? prev.rooms,
          localIP: (d.localIP as string) ?? prev.localIP,
        }))
      }
      if ('username' in d || 'token' in d) {
        setUser((prev) => ({
          username: (d.username as string) ?? prev.username,
          token: (d.token as string) ?? prev.token,
        }))
      }
      if ('room' in d) {
        setCurrentRoom(d.room as Room)
      }
    }
    setRoute(next)
  }

  if (route === 'login') return <LoginPage navigate={navigate} />
  if (route === 'signup') return <SignupPage navigate={navigate} />
  if (route === 'about') return <AboutPage navigate={navigate} />
  if (route === 'discover') return <DiscoveryPage navigate={navigate} />
  if (route === 'create-room') return <CreateRoomPage navigate={navigate} localIP={roomsData.localIP} username={user.username} token={user.token} />
  if (route === 'room-list') return <RoomListPage navigate={navigate} rooms={roomsData.rooms} localIP={roomsData.localIP} username={user.username} token={user.token} />
  if (route === 'chat' && currentRoom) return <ChatPage navigate={navigate} room={currentRoom} username={user.username} token={user.token} localIP={roomsData.localIP} />

  return <HomePage navigate={navigate} />
}
