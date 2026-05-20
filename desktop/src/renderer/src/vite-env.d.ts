/// <reference types="vite/client" />

export type Room = {
  name: string
  protected: boolean
  members: string[]
  host: string
  port: number
}

export type Profile = {
  username: string
  avatar_emoji: string
  status: 'available' | 'busy' | 'dnd'
  bio: string
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
        profile?: { avatar_emoji: string; status: string; bio: string }
      }) => Promise<{
        ok: boolean
        room: string
        members: string[]
        memberProfiles: { username: string; profile: { avatar_emoji: string; status: string; bio: string } }[]
        history: { from: { username: string }; message: string; at: string }[]
      }>
      clientSendMessage: (args: { room?: string; token: string; message: string }) => Promise<{ ok: boolean }>
      getLocalIP: () => Promise<{ ip: string }>
      discoverAndListRooms: (args?: {
        port?: number
        connectTimeoutMs?: number
      }) => Promise<{ rooms: Room[]; localIP: string }>
      notify: (args: { title: string; body: string }) => Promise<void>
      clientProfileUpdate: (args: { room: string; token: string; profile: { avatar_emoji: string; status: string; bio: string } }) => Promise<{ ok: boolean }>
      clientRename: (args: { newUsername: string; room: string; token: string }) => Promise<{ ok: boolean }>
      hostGetRoomDetails: (args: { room: string }) => Promise<{ members: { userId: string; username: string; ip: string }[] }>
      hostKickClient: (args: { room: string; userId: string }) => Promise<{ ok: boolean }>
      hostBanClient: (args: { room: string; userId: string }) => Promise<{ ok: boolean }>
      hostUpdateRoom: (args: { room: string; newName?: string; newPassword?: string }) => Promise<{ ok: boolean; name: string }>
      signLocalToken: (args: { username: string }) => Promise<{ token: string }>
      clientLeave: () => Promise<{ ok: boolean }>
      hostDeleteRoom: (args: { room: string }) => Promise<{ ok: boolean }>
      onMessage: (cb: (msg: unknown) => void) => void
      getAutoStart: () => Promise<{ enabled: boolean }>
      setAutoStart: (args: { enabled: boolean }) => Promise<{ enabled: boolean }>
      saveFile: (args: { defaultName?: string; content: string }) => Promise<{ ok: boolean; filePath?: string }>
      openFile: () => Promise<{ ok: boolean; filePath?: string; content?: string }>
    }
  }
}

