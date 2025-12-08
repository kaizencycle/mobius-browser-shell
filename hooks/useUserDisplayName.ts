/**
 * Mobius Systems - User Display Name Hook
 * 
 * Extracts a friendly display name from user data.
 * Prefers name, falls back to first part of email.
 */

interface UserData {
  name?: string;
  email?: string;
}

export function useUserDisplayName(user?: UserData | null): string | null {
  if (!user) return null;

  // Prefer name, fallback to first part of email
  if (user.name) return user.name;

  if (user.email) {
    const emailName = user.email.split('@')[0];
    // Capitalize first letter
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return null;
}
