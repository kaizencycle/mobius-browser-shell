/**
 * CitizenProfileButton
 *
 * Compact button for the shell nav. Shows handle initial in a circle avatar,
 * @handle label hidden on mobile. Triggers profile drawer open.
 */

import { useAuth } from '../../contexts/AuthContext';

interface CitizenProfileButtonProps {
  onClick: () => void;
}

export function CitizenProfileButton({ onClick }: CitizenProfileButtonProps) {
  const { citizen } = useAuth();

  if (!citizen) return null;

  const initial = citizen.handle
    ? citizen.handle.charAt(0).toUpperCase()
    : '⬡';

  return (
    <button
      onClick={onClick}
      aria-label="Open citizen profile"
      className="flex items-center space-x-1.5 px-2 py-1.5 text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500"
    >
      <div className="w-7 h-7 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-xs font-medium text-stone-700">
        {initial}
      </div>
      <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate font-mono">
        {citizen.handle ? `@${citizen.handle}` : citizen.citizenId.slice(0, 8)}
      </span>
    </button>
  );
}
