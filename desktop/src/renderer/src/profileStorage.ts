export function getLocalProfile(username: string): { avatar_emoji: string; status: string; bio: string } {
  try {
    const raw = localStorage.getItem(`closechat:profile:${username}`)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return { avatar_emoji: '😊', status: 'available', bio: '' }
}
