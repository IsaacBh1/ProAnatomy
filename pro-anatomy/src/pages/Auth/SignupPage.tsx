// src/pages/Auth/SignupPage.tsx
import { useState, type FormEvent } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { AuthField, AuthLayout, GoogleButton, OrDivider, useAuthStore } from '@/features/auth'
import {
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  normalizeName,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from '@/features/auth/utils/validation'

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirm?: string
}

export default function SignupPage() {
  const navigate = useNavigate()
  const signUp = useAuthStore((s) => s.signUp)
  const pending = useAuthStore((s) => s.pending)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const clear = (key: keyof FieldErrors) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const nextErrors: FieldErrors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirm: validateConfirm(password, confirm) ?? undefined,
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    const result = await signUp({
      name: normalizeName(name),
      email: normalizeEmail(email),
      password,
    })

    if (!result.ok) {
      if (result.error.code === 'email_taken') {
        setErrors((prev) => ({ ...prev, email: result.error.message }))
      } else {
        setFormError(result.error.message)
      }
      return
    }
    navigate('/anatomy', { replace: true })
  }

  return (
    <AuthLayout>
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-content">
          Create your account
        </h1>
        <p className="text-base text-muted">Free, and everything stays on your device.</p>
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
          label="Name"
          type="text"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            clear('name')
          }}
          error={errors.name}
          maxLength={60}
        />

        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            clear('email')
          }}
          error={errors.email}
          spellCheck={false}
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            clear('password')
            if (confirm) clear('confirm')
          }}
          error={errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            clear('confirm')
          }}
          error={errors.confirm}
        />

        <Button
          type="submit"
          disabled={pending}
          className="mt-2 h-11 w-full rounded-xl bg-content px-4 text-sm font-medium text-canvas hover:bg-content/85"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </Button>

        <OrDivider />

        <GoogleButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-content underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
