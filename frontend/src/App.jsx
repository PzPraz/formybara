import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import FormList from './pages/FormList.jsx'
import FormDetail from './pages/FormDetail.jsx'
import RespondForm from './pages/RespondForm.jsx'
import SubmitSuccess from './pages/SubmitSuccess.jsx'
import { getToken } from './lib/api.js'

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = !!getToken()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Redirect to /forms if logged in, otherwise show Home
function HomeOrForms() {
  const isAuthenticated = !!getToken()
  return isAuthenticated ? <Navigate to="/forms" replace /> : <Home />
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomeOrForms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/forms"
              element={
                <ProtectedRoute>
                  <FormList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/:id"
              element={
                <ProtectedRoute>
                  <FormDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/respond/:id" element={<RespondForm />} />
            <Route path="/respond/:id/success" element={<SubmitSuccess />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
