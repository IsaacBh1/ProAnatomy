import { createBrowserRouter, Navigate } from 'react-router-dom'
import AnatomyPage from '@/pages/Anatomy/AnatomyPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/anatomy" replace /> },
  { path: '/anatomy', element: <AnatomyPage /> },
  { path: '*', element: <p className="p-8">Page not found</p> },
])
