import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setOpen(false), [location])

  const navLinks = [
    { label: 'Home', href: '/#home' },
    { label: 'Courts', href: '/#courts' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Contact', href: '/#contact' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-navy shadow-xl' : 'bg-brand-navy/95 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">

          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-brand-pink flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-transform">
              N²P
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-lg leading-tight">NET N&apos; PADDLE</p>
              <p className="text-brand-lime text-xs font-medium tracking-wider">JUST DINK IT!</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="nav-link text-white/80 hover:text-white text-sm font-medium transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:block">
            <Link to="/booking" className="btn-primary text-sm py-2 px-6">Book a Court</Link>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-white p-2">
            {open ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-brand-navy-dark border-t border-white/10 px-4 py-4 space-y-3">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="block text-white/80 hover:text-white py-2 text-sm font-medium">
              {l.label}
            </a>
          ))}
          <Link to="/booking" className="block w-full text-center bg-brand-pink text-white font-semibold py-3 px-6 rounded-full mt-3">
            Book a Court
          </Link>
        </div>
      )}
    </nav>
  )
}
