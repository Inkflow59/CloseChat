/// <reference types="vite/client" />

export type Room = {
  name: string
  protected: boolean
  members: string[]
  host: string
  port: number
}

declare global {
  interface Window {
    closechatLan: {
      hostStart: (args?: { port?: number }) => Promise<{ ok: boolean; port: number }>
      hostCreateRoom: (args: {
        room: string
        roomPassword?: string
      }) => Promise<{ ok: boolean; room: string; protected: boolean }>
      hostGetRooms: () => Promise<{ rooms: Room[] }>
      clientJoin: (args: {
        url: string
        room: string
        token: string
        roomPassword?: string
      }) => Promise<{ ok: boolean; room: string }>
      clientSendMessage: (args: { room?: string; token: string; message: string }) => Promise<{ ok: boolean }>
      getLocalIP: () => Promise<{ ip: string }>
      discoverAndListRooms: (args?: {
        port?: number
        connectTimeoutMs?: number
      }) => Promise<{ rooms: Room[]; localIP: string }>
      signLocalToken: (args: { username: string }) => Promise<{ token: string }>
      clientLeave: () => Promise<{ ok: boolean }>
      hostDeleteRoom: (args: { room: string }) => Promise<{ ok: boolean }>
      onMessage: (cb: (msg: unknown) => void) => void
    }
  }
}

