import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/app-layout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import EmailVerification from '@/pages/EmailVerification'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import HabitList from '@/pages/HabitList'
import HabitDetail from '@/pages/HabitDetail'
import EditHabit from '@/pages/EditHabit'
import CreateHabit from '@/pages/CreateHabit'
import Profile from '@/pages/Profile'
import Rewards from '@/pages/Rewards'
import Leaderboard from '@/pages/Leaderboard'
import Challenges from '@/pages/Challenges'
import NotFound from '@/pages/NotFound'
import ServerError from '@/pages/ServerError'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="habits" element={<HabitList />} />
              <Route path="habits/new" element={<CreateHabit />} />
              <Route path="habits/:id" element={<HabitDetail />} />
              <Route path="habits/:id/edit" element={<EditHabit />} />
              <Route path="rewards" element={<Rewards />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="challenges" element={<Challenges />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/404" element={<NotFound />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
