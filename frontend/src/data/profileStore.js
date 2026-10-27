// src/data/profileStore.js

/**
 * Creates and retrieves user-scoped profile metadata.
 * Dynamically derives profile defaults from the authenticated user identity
 * instead of hardcoded static mock placeholders.
 */
export function getStoredProfile(userId, currentUser) {
  const defaultProfile = {
    displayName: currentUser?.displayName || currentUser?.username || 'Developer',
    username: currentUser?.username || 'developer',
    title: currentUser?.role === 'ROLE_ADMIN' ? 'Platform Administrator' : 'Software Developer',
    bio: 'Passionate developer sharpening typing cadence, keystroke accuracy, and algorithmic problem solving.',
    avatar: (currentUser?.displayName || currentUser?.username || 'D').slice(0, 2).toUpperCase(),
    avatarBg: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
    level: currentUser?.level || 1,
    xp: currentUser?.totalXp || 0,
    nextLevelXp: currentUser?.nextLevelXp || 200,
    streak: 0,
    bestWpm: null,
    avgWpm: null,
    sessions: 0,
    precision: 100,
    favLang: 'Code',
    joinedDate: currentUser?.createdAt
      ? new Date(currentUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : 'Recently',
    githubUrl: 'https://github.com',
    website: '',
  };

  const keyId = userId || currentUser?.id || currentUser?.username;
  if (!keyId) return defaultProfile;

  try {
    const raw = localStorage.getItem(`devtype_profile_custom_${keyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaultProfile,
        ...parsed,
        // Authoritative server identity takes priority
        displayName: currentUser?.displayName || parsed.displayName || defaultProfile.displayName,
        username: currentUser?.username || parsed.username || defaultProfile.username,
        level: currentUser?.level ?? defaultProfile.level,
        xp: currentUser?.totalXp ?? defaultProfile.xp,
      };
    }
  } catch (e) {
    console.error('Failed to load user profile from storage', e);
  }
  return defaultProfile;
}

export function saveStoredProfile(profile, userId) {
  const keyId = userId || profile?.id || profile?.username;
  if (!keyId) return;
  try {
    localStorage.setItem(`devtype_profile_custom_${keyId}`, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile to storage', e);
  }
}

export function getStoredFriends(userId) {
  if (!userId) return { connected: [], received: [], sent: [] };
  try {
    const raw = localStorage.getItem(`devtype_friends_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load friends from storage', e);
  }
  return { connected: [], received: [], sent: [] };
}

export function saveStoredFriends(friends, userId) {
  if (!userId) return;
  try {
    localStorage.setItem(`devtype_friends_${userId}`, JSON.stringify(friends));
  } catch (e) {
    console.error('Failed to save friends to storage', e);
  }
}
