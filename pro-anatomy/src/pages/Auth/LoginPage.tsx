import { useState, type FormEvent } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { AuthField, AuthLayout, GoogleButton, OrDivider, useAuthStore } from '@/features/auth'
import { validateEmail, validatePassword } from '@/features/auth/utils/validation'

interface FieldErrors {
  email?: string
  password?: string
}

interface LocationState {
  from?: { pathname: string }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useAuthStore((s) => s.signIn)
  const pending = useAuthStore((s) => s.pending)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const from = (location.state as LocationState | null)?.from?.pathname ?? '/anatomy'

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const nextErrors: FieldErrors = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    }
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    const result = await signIn({ email, password })
    if ("error" in result) {
      setFormError(result.error.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout>
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-content">
          Welcome back
        </h1>
        <p className="text-base text-muted">Sign in to pick up where you left off.</p>
      </header>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-xs text-red-400"
          >
            <WarningCircle size={14} aria-hidden className="mt-0.5 shrink-0" />
            <p>{formError}</p>
          </div>
        )}

        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          error={errors.email}
          spellCheck={false}
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
          }}
          error={errors.password}
        />

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-xl bg-content px-4 text-sm font-medium text-canvas hover:bg-content/85"
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>

        <OrDivider />

        <GoogleButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link
          to="/signup"
          className="font-medium text-content underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
