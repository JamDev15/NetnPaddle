import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-brand-navy-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-pink flex items-center justify-center text-white font-black">N²P</div>
              <div>
                <p className="text-white font-bold text-xl">NET N&apos; PADDLE</p>
                <p className="text-brand-lime text-xs tracking-wider font-medium">JUST DINK IT!</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Your premier pickleball destination in Suaybaguio District. Top-quality courts and a vibrant
              community for players of all levels.
            </p>
            <div className="flex gap-3">
              {['FB', 'IG', 'TW'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand-pink flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">{s}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-brand-lime mb-5 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'Book a Court', to: '/booking' },
                { label: 'Booking Policy', to: '/policy' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-white/60 hover:text-brand-pink text-sm transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-brand-lime mb-5 uppercase text-xs tracking-widest">Contact & Hours</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/60">
                <span className="text-brand-pink mt-0.5">📍</span>
                1485 Mirafuentes St., Suaybaguio District
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-brand-pink">📞</span> 09703778990
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <span className="text-brand-pink">🕐</span> Mon–Sun · Open 24 Hours
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-white/40 text-xs">© 2026 Net N&apos; Paddle. All rights reserved.</p>
          <p className="text-white/40 text-xs">EST. 2026 · Just Dink It!</p>
        </div>
      </div>
    </footer>
  )
}
