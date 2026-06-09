import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../../utils/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    document.title = "Admin Login — Net N' Paddle"
    if (localStorage.getItem('adminToken')) navigate('/admin')
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Enter your credentials')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('adminToken', res.token)
      toast.success('Welcome back, Admin!')
      navigate('/admin')
    } catch (err) {
      toast.error(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-lime/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-brand-pink flex items-center justify-center mx-auto mb-4 shadow-lg pink-glow">
            <span className="text-white font-black text-2xl">N²P</span>
          </div>
          <h1 className="text-2xl font-black text-white">NET N&apos; PADDLE</h1>
          <p className="text-brand-lime text-sm font-medium tracking-wider">ADMIN PANEL</p>
        </div>

        <form onSubmit={handleLogin} className="card p-8">
          <h2 className="text-xl font-bold text-brand-navy mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to manage bookings and payments</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin" className="input-field" autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="input-field pr-12" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass
                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full mt-6 bg-brand-pink hover:bg-brand-pink-dark disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-colors">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
            <p className="font-semibold mb-1">Default Credentials</p>
            <p>Username: <span className="font-mono font-bold text-brand-navy">admin</span></p>
            <p>Password: <span className="font-mono font-bold text-brand-navy">netpaddle2026</span></p>
          </div>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">Net N&apos; Paddle © 2026 · Suaybaguio District</p>
      </div>
    </div>
  )
}
