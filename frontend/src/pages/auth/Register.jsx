import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import { registerUser, storeToken } from '../../lib/api.js'
import { validateEmail, validatePassword, validateName } from '../../lib/validation.js'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setErrors({ name: '', email: '', password: '' })

    // Validate inputs
    const nameValidation = validateName(name)
    const emailValidation = validateEmail(email)
    const passwordValidation = validatePassword(password)

    if (!nameValidation.valid || !emailValidation.valid || !passwordValidation.valid) {
      setErrors({
        name: nameValidation.error || '',
        email: emailValidation.error || '',
        password: passwordValidation.error || '',
      })
      return
    }

    try {
      setLoading(true)
      const result = await registerUser({ name, email, password })
      storeToken(result.token)
      setStatus({ type: 'success', message: 'Register berhasil. Redirecting...' })
      setTimeout(() => navigate('/forms'), 500)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Buat Akun</h2>
        <p className="subtext">Buat akun baru untuk mulai menyusun form</p>
        <form className="stack" onSubmit={handleSubmit}>
          <Input
            label="Nama lengkap"
            placeholder="Nama kamu"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
            }}
            error={errors.name}
            disabled={loading}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
            }}
            error={errors.email}
            disabled={loading}
            required
          />
          <div className="password-field-wrapper">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimal 8 karakter"
              helper="Gunakan kombinasi huruf dan angka."
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
              }}
              error={errors.password}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          {status.message ? (
            <p className={`form-status ${status.type}`}>{status.message}</p>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Spinner size="small" /> Registering...
              </span>
            ) : 'Daftar'}
          </Button>
        </form>
      </div>
      <p className="subtext" style={{ textAlign: 'center' }}>
        Sudah punya akun? <Link to="/login" className="link">Masuk</Link>
      </p>
    </div>
  )
}
