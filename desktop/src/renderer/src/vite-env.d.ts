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
      }) => Promise<{ ok: boolean; room: string; members: string[] }>
      clientSendMessage: (args: { room?: string; token: string; message: string }) => Promise<{ ok: boolean }>
      getLocalIP: () => Promise<{ ip: string }>
      discoverAndListRooms: (args?: {
        port?: number
        connectTimeoutMs?: number
      }) => Promise<{ rooms: Room[]; localIP: string }>
      clientRename: (args: { newUsername: string; room: string; token: string }) => Promise<{ ok: boolean }>
      hostGetRoomDetails: (args: { room: string }) => Promise<{ members: { userId: string; username: string; ip: string }[] }>
      hostKickClient: (args: { room: string; userId: string }) => Promise<{ ok: boolean }>
      hostBanClient: (args: { room: string; userId: string }) => Promise<{ ok: boolean }>
      hostUpdateRoom: (args: { room: string; newName?: string; newPassword?: string }) => Promise<{ ok: boolean; name: string }>
      signLocalToken: (args: { username: string }) => Promise<{ token: string }>
      clientLeave: () => Promise<{ ok: boolean }>
      hostDeleteRoom: (args: { room: string }) => Promise<{ ok: boolean }>
      onMessage: (cb: (msg: unknown) => void) => void
    }
  }
}

