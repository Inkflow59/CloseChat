export type StoredProfile = {
  avatar_emoji: string
  status: string
  bio: string
  isPersisted: boolean
}

const key = (username: string) => `closechat:profile:${username}`

export function getLocalProfile(username: string): StoredProfile {
  try {
    const raw = localStorage.getItem(key(username))
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        avatar_emoji: parsed.avatar_emoji || '😊',
        status: parsed.status || 'available',
        bio: parsed.bio || '',
        isPersisted: parsed.isPersisted !== false, // défaut true pour les anciens enregistrements
      }
    }
  } catch (_) {}
  return { avatar_emoji: '😊', status: 'available', bio: '', isPersisted: true }
}

export function saveLocalProfile(username: string, profile: Omit<StoredProfile, 'isPersisted'>, isPersisted: boolean) {
  try {
    localStorage.setItem(key(username), JSON.stringify({ ...profile, isPersisted }))
  } catch (_) {}
}

export function markPersisted(username: string) {
  try {
    const raw = localStorage.getItem(key(username))
    if (!raw) return
    const parsed = JSON.parse(raw)
    localStorage.setItem(key(username), JSON.stringify({ ...parsed, isPersisted: true }))
  } catch (_) {}
}
