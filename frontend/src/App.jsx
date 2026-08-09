import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import AptitudeTest from './pages/AptitudeTest'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ResumeUpload from './pages/ResumeUpload'
import TechnicalTest from './pages/TechnicalTest'
import CodePractice from './pages/CodePractice'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route
              path="resume"
              element={
                <ProtectedRoute>
                  <ResumeUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="aptitude"
              element={
                <ProtectedRoute>
                  <AptitudeTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="technical"
              element={
                <ProtectedRoute>
                  <TechnicalTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="practice"
              element={
                <ProtectedRoute>
                  <CodePractice />
                </ProtectedRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}
