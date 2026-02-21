import { useGuest } from '../../contexts/GuestContext';

/**
 * GuestNudge
 *
 * Appears when a guest attempts a gated action.
 * Not a modal — a bottom sheet style prompt that doesn't block the page.
 * Dismissable. Single clear CTA.
 *
 * The message adapts to the action that was attempted.
 */

const ACTION_MESSAGES: Record<string, { title: string; detail: string }> = {
  save_progress: {
    title: 'Your progress won\'t be saved',
    detail: 'Citizen identity is required to save learning progress and earn MIC.',
  },
  earn_mic: {
    title: 'MIC requires a citizen identity',
    detail: 'Sign the Three Covenants to start earning Mobius Integrity Credits.',
  },
  submit_quiz: {
    title: 'Quiz results require citizen identity',
    detail: 'Complete this module as a citizen to earn MIC and save your score.',
  },
  create_agent: {
    title: 'Agents require citizen identity',
    detail: 'You can explore the creator, but saving an agent requires a covenant.',
  },
  claim_genesis_grant: {
    title: 'Claim your 50 MIC genesis grant',
    detail: 'Sign the Three Covenants. Your first act of integrity, recognized.',
  },
  flag_threat: {
    title: 'Flagging requires citizen identity',
    detail: 'Citizens can flag threats to the Citizen Shield record.',
  },
  default: {
    title: 'This action requires citizen identity',
    detail: 'Sign the Three Covenants to access all features of Mobius Substrate.',
  },
};

export function GuestNudge() {
  const { nudgeVisible, nudgeAction, dismissNudge, triggerBecomeCitizen } = useGuest();

  if (!nudgeVisible) return null;

  const message = nudgeAction
    ? (ACTION_MESSAGES[nudgeAction] ?? ACTION_MESSAGES.default)
    : ACTION_MESSAGES.default;

  return (
    <>
      {/* Backdrop — light, dismissable */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
        onClick={dismissNudge}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-label="Citizen identity required"
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6 animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="w-full max-w-sm bg-stone-900 border border-stone-700/60 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">

          {/* Icon + message */}
          <div className="flex items-start gap-3">
            <span className="text-stone-500 text-lg select-none mt-0.5">⬡</span>
            <div className="flex flex-col gap-1">
              <p className="text-stone-200 text-sm font-medium">{message.title}</p>
              <p className="text-stone-500 text-xs leading-relaxed">{message.detail}</p>
            </div>
          </div>

          {/* Genesis grant reminder */}
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-stone-800/60 border border-stone-800">
            <span className="text-stone-600 text-xs select-none">◎</span>
            <span className="text-stone-600 text-[10px]">
              Become a citizen and receive ◎ 50 MIC genesis grant
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={dismissNudge}
              className="flex-1 py-2.5 px-3 text-xs text-stone-600 hover:text-stone-400 border border-stone-800 hover:border-stone-700 rounded-xl transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500"
            >
              Keep exploring
            </button>
            <button
              onClick={triggerBecomeCitizen}
              className="flex-1 py-2.5 px-3 text-xs text-stone-200 bg-stone-700 hover:bg-stone-600 border border-stone-600 rounded-xl transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
            >
              Become a Citizen →
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
