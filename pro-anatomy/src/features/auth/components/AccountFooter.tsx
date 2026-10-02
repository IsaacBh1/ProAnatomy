import { SignOut } from '@phosphor-icons/react'
import { Button } from '@/components/ui'
import { useAuthStore } from '../store/authStore'

/**
 * Signed-in user summary, pinned to the bottom of the sidebar. The sign-out
 * action is deliberately the only thing here — account settings don't exist yet.
 */
export function AccountFooter() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  if (!user) return null

  return (
    <div className="mt-auto flex items-center gap-2 rounded-xl border border-border bg-surface-raised p-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-content">{user.name}</p>
        <p className="truncate text-[10px] text-muted">{user.email}</p>
      </div>
      <Button
        icon={SignOut}
        aria-label="Sign out"
        title="Sign out"
        onClick={() => void signOut()}
        className="size-7"
      />
    </div>
  )
}
