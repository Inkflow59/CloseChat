/// <reference types="vite/client" />

declare global {
  interface Window {
    closechatLan?: {
      hostStart: (args: { port?: number }) => Promise<{ ok: boolean; port: number }>
      hostCreateRoom: (args: { room: string; roomPassword?: string }) => Promise<any>
      clientJoin: (args: {
        url: string
        room: string
        token: string
        roomPassword?: string
      }) => Promise<any>
      clientSendMessage: (args: { room?: string; token: string; message: string }) => Promise<any>
      onMessage: (cb: (msg: any) => void) => void
    }
  }
}

export {}

