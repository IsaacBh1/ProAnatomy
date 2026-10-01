import { createBrowserRouter, Navigate } from 'react-router-dom'
import AnatomyPage from '@/pages/Anatomy/AnatomyPage'
import LoginPage from '@/pages/Auth/LoginPage'
import SignupPage from '@/pages/Auth/SignupPage'
import { RedirectIfAuthed, RequireAuth } from '@/features/auth'
import { LandingPage } from '@/features/landing'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: '/signup',
    element: (
      <RedirectIfAuthed>
        <SignupPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: '/anatomy',
    element: (
      <RequireAuth>
        <AnatomyPage />
      </RequireAuth>
    ),
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
