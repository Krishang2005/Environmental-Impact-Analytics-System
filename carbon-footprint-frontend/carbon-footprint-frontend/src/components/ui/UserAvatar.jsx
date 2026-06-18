import { useEffect, useMemo, useState } from 'react'

export const avatarOptions = [
  {
    id: 'curly',
    label: 'Curly hair',
    bg: '#9bd8df',
    skin: '#fff0dd',
    hair: '#14294a',
    shirt: '#bdb7ef',
    accent: '#51468f',
    style: 'curly',
  },
  {
    id: 'glasses',
    label: 'Glasses',
    bg: '#c8c3f5',
    skin: '#f6ead9',
    hair: '#89e0df',
    shirt: '#8dd3cf',
    accent: '#1b2d4d',
    style: 'glasses',
  },
  {
    id: 'bun',
    label: 'Top bun',
    bg: '#9bd8df',
    skin: '#f4eadf',
    hair: '#a889f0',
    shirt: '#162946',
    accent: '#f2f0ff',
    style: 'bun',
  },
  {
    id: 'short',
    label: 'Short hair',
    bg: '#c8c3f5',
    skin: '#f9ead8',
    hair: '#132746',
    shirt: '#162946',
    accent: '#82d9d4',
    style: 'short',
  },
  {
    id: 'sidepart',
    label: 'Side part',
    bg: '#9bd8df',
    skin: '#f5eadc',
    hair: '#f2e4d8',
    shirt: '#b7aef0',
    accent: '#4f44a0',
    style: 'sidepart',
  },
  {
    id: 'fade',
    label: 'Clean fade',
    bg: '#c8c3f5',
    skin: '#f8ead9',
    hair: '#14294a',
    shirt: '#d9f2e9',
    accent: '#85d9d4',
    style: 'fade',
  },
]

const defaultAvatar = avatarOptions[0]
const avatarChangedEvent = 'carbontrack-avatar-changed'

export function getAvatarForIdentity(identity) {
  const text = String(identity || 'guest')
  const hash = Array.from(text).reduce((total, char) => total + char.charCodeAt(0), 0)
  return avatarOptions[hash % avatarOptions.length]
}

function getAvatarKey(user, isAdmin) {
  return `carbontrack-avatar:${isAdmin ? 'admin' : 'user'}:${user?.email || 'guest'}`
}

function normalizeAvatarId(avatarId) {
  return avatarOptions.some((option) => option.id === avatarId) ? avatarId : defaultAvatar.id
}

function readAvatarId(key) {
  if (typeof window === 'undefined') return defaultAvatar.id
  return normalizeAvatarId(window.localStorage.getItem(key))
}

function Hair({ avatar }) {
  switch (avatar.style) {
    case 'curly':
      return (
        <g fill={avatar.hair}>
          <path d="M25 48c-7-8-4-25 7-31 10-6 27-5 35 4 8 8 10 20 4 28l-6-3c2-11-3-20-14-22-11-3-21 1-24 12-1 4 0 8 2 12z" />
          {[[31, 27], [39, 19], [50, 18], [60, 24], [68, 35], [28, 38], [36, 33]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="9" />
          ))}
        </g>
      )
    case 'glasses':
      return (
        <g fill={avatar.hair}>
          <path d="M30 28c8-11 30-12 39 0-3 5-9 7-17 5-7-2-14-1-22 2z" />
          <path d="M31 24c-6 9-6 19 0 27l5-2c-2-9-2-17 1-24z" />
          <path d="M67 24c6 9 6 19 0 27l-5-2c2-9 2-17-1-24z" />
        </g>
      )
    case 'bun':
      return (
        <g fill={avatar.hair}>
          <circle cx="50" cy="17" r="10" />
          <path d="M28 31c7-13 33-14 43 0 6 9 3 22-2 30H31c-5-8-9-21-3-30z" />
          <path d="M24 45c2 15 10 24 26 24s24-9 26-24c-7 6-15 8-26 8s-19-2-26-8z" opacity=".35" />
        </g>
      )
    case 'short':
      return <path fill={avatar.hair} d="M28 33c3-13 19-20 33-13 8 4 13 12 12 24-9-9-20-13-33-13-5 0-9 1-12 2z" />
    case 'sidepart':
      return (
        <g fill={avatar.hair} stroke="#172748" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
          <path d="M25 37c7-18 27-26 46-11-4 10-16 14-36 13-4 0-7-1-10-2z" />
          <path d="M33 34c8-2 17-8 24-17" fill="none" />
        </g>
      )
    default:
      return <path fill={avatar.hair} d="M29 31c5-11 15-15 29-12 9 2 15 8 16 20-14-5-29-5-45 0z" />
  }
}

function Accessory({ avatar }) {
  if (avatar.style !== 'glasses') return null

  return (
    <g fill="none" stroke="#172748" strokeLinecap="round" strokeWidth="2">
      <circle cx="40" cy="43" r="6" />
      <circle cx="60" cy="43" r="6" />
      <path d="M46 43h8" />
    </g>
  )
}

export function AvatarPortrait({ avatar, className = '' }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <circle cx="50" cy="50" r="48" fill={avatar.bg} stroke="#172748" strokeWidth="2" />
      <clipPath id={`avatar-clip-${avatar.id}`}>
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <g clipPath={`url(#avatar-clip-${avatar.id})`}>
        <path fill={avatar.accent} opacity=".24" d="M75 12c12 20 11 44-2 75h30V12z" />
        <path fill={avatar.shirt} d="M21 91c3-18 13-27 29-27s26 9 29 27z" />
        <path fill="#172748" opacity=".14" d="M24 91c6-11 15-17 26-17s20 6 26 17z" />
        <path fill={avatar.skin} stroke="#172748" strokeWidth="1.7" d="M43 59h14v12c0 4-3 7-7 7s-7-3-7-7z" />
        <path fill={avatar.skin} stroke="#172748" strokeWidth="1.7" d="M30 37c1-16 10-25 20-25s19 9 20 25l-2 14c-2 12-9 19-18 19s-16-7-18-19z" />
        <Hair avatar={avatar} />
        <path fill={avatar.skin} stroke="#172748" strokeWidth="1.4" d="M29 44c-5 0-6 11 1 12M71 44c5 0 6 11-1 12" />
        <Accessory avatar={avatar} />
        <g stroke="#172748" strokeLinecap="round" strokeWidth="1.8">
          <path d="M39 42c3-2 6-2 9 0" />
          <path d="M52 42c3-2 6-2 9 0" />
          <path d="M47 55c2 1 4 1 6 0" />
          <path d="M43 61c5 3 10 3 15 0" />
        </g>
        <g fill={avatar.accent}>
          <circle cx="37" cy="49" r="2.5" opacity=".6" />
          <circle cx="63" cy="49" r="2.5" opacity=".6" />
        </g>
      </g>
    </svg>
  )
}

export function useSelectedAvatar(user, isAdmin) {
  const avatarKey = useMemo(() => getAvatarKey(user, isAdmin), [user?.email, isAdmin])
  const [avatarId, setAvatarId] = useState(() => readAvatarId(avatarKey))

  useEffect(() => {
    setAvatarId(readAvatarId(avatarKey))

    const syncAvatar = (event) => {
      if (event.type === 'storage' && event.key !== avatarKey) return
      setAvatarId(readAvatarId(avatarKey))
    }

    window.addEventListener('storage', syncAvatar)
    window.addEventListener(avatarChangedEvent, syncAvatar)
    return () => {
      window.removeEventListener('storage', syncAvatar)
      window.removeEventListener(avatarChangedEvent, syncAvatar)
    }
  }, [avatarKey])

  const setSelectedAvatar = (nextAvatarId) => {
    window.localStorage.setItem(avatarKey, normalizeAvatarId(nextAvatarId))
    window.dispatchEvent(new Event(avatarChangedEvent))
    setAvatarId(normalizeAvatarId(nextAvatarId))
  }

  return {
    avatar: avatarOptions.find((option) => option.id === avatarId) || defaultAvatar,
    avatarId,
    setSelectedAvatar,
  }
}

export function UserAvatar({ user, isAdmin, size = 'md', className = '' }) {
  const { avatar } = useSelectedAvatar(user, isAdmin)
  const sizeClass = {
    sm: 'h-7 w-7',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }[size]

  return (
    <div className={`${sizeClass} overflow-hidden rounded-full shadow-glow ${className}`}>
      <AvatarPortrait avatar={avatar} className="h-full w-full" />
    </div>
  )
}

export function IdentityAvatar({ identity, size = 'md', className = '' }) {
  const avatar = getAvatarForIdentity(identity)
  const sizeClass = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }[size]

  return (
    <div className={`${sizeClass} overflow-hidden rounded-full shadow-glow ${className}`}>
      <AvatarPortrait avatar={avatar} className="h-full w-full" />
    </div>
  )
}
