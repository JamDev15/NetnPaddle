import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const COURTS = [
  { id: 'court-1', name: 'Court 1', type: 'Outdoor', price: 250,
    features: ['Outdoor court', 'Professional surface', 'Natural lighting', 'Shaded area'],
    grad: 'from-brand-pink to-brand-pink-dark' },
  { id: 'court-2', name: 'Court 2', type: 'Outdoor', price: 250,
    features: ['Outdoor court', 'Professional surface', 'Natural lighting', 'Spectator area'],
    grad: 'from-brand-navy to-brand-navy-light' },
  { id: 'court-3', name: 'Court 3', type: 'Outdoor', price: 250,
    features: ['Outdoor court', 'Professional surface', 'Natural lighting', 'Parking nearby'],
    grad: 'from-brand-lime-dark to-green-600' },
]

function PickleballIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-lg">
      {/* Paddle face */}
      <ellipse cx="54" cy="36" rx="26" ry="30" fill="white" opacity="0.92" />
      {/* Paddle face grid lines */}
      <line x1="54" y1="8" x2="54" y2="64" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
      <line x1="30" y1="36" x2="78" y2="36" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
      <line x1="35" y1="20" x2="73" y2="20" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <line x1="35" y1="52" x2="73" y2="52" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <line x1="42" y1="12" x2="42" y2="62" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      <line x1="66" y1="12" x2="66" y2="62" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
      {/* Paddle outline */}
      <ellipse cx="54" cy="36" rx="26" ry="30" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
      {/* Handle */}
      <rect x="49" y="63" width="10" height="26" rx="5" fill="white" opacity="0.75" />
      <rect x="51" y="65" width="6" height="22" rx="3" fill="rgba(0,0,0,0.08)" />
      {/* Ball */}
      <circle cx="24" cy="72" r="14" fill="#E8FF40" />
      <circle cx="24" cy="72" r="14" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {[[-4,-6],[2,-8],[7,-3],[8,4],[3,9],[-4,8],[-8,2],[-7,-4]].map(([dx,dy],i) => (
        <circle key={i} cx={24+dx} cy={72+dy} r="2.2" fill="rgba(80,100,0,0.35)" />
      ))}
      {/* Ball shine */}
      <ellipse cx="19" cy="66" rx="4" ry="2.5" fill="white" opacity="0.35" transform="rotate(-30,19,66)" />
    </svg>
  )
}

const STEPS = [
  { n: '01', title: 'Choose Your Court', desc: "Browse 3 outdoor courts and pick the one that fits your game." },
  { n: '02', title: 'Pick Date & Time', desc: "Select your preferred date and available slot. We're open 6 AM–11 PM every day." },
  { n: '03', title: 'Pay & Confirm', desc: "Pay via GoTyme Bank InstaPay and upload your screenshot. Get instant confirmation." },
]

export default function Home() {
  useEffect(() => { document.title = "Net N' Paddle — Just Dink It!" }, [])

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section id="home" className="hero-gradient min-h-screen flex items-center relative overflow-hidden pt-20">
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-pink/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-brand-lime/10 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-brand-lime rounded-full opacity-60 animate-float" />
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-brand-pink rounded-full opacity-40 animate-float" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 bg-brand-pink/20 border border-brand-pink/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
              <span className="text-brand-lime text-sm font-medium">Now Open · Est. 2026</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-4">
              NET N&apos;<br /><span className="text-brand-pink">PADDLE</span>
            </h1>
            <p className="text-2xl md:text-3xl font-bold text-brand-lime mb-6">Just Dink It! 🏓</p>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              Suaybaguio District&apos;s premier pickleball destination. 3 outdoor courts, open daily
              6 AM–11 PM. Book online in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking" className="btn-primary text-base py-4 px-10 animate-pulse-pink">Book a Court Now</Link>
              <a href="#courts" className="btn-outline text-base py-4 px-10">View Courts</a>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 pt-12 border-t border-white/10">
              {[['3', 'Courts'], ['7', 'Days/Week'], ['17hrs', 'Daily'], ['₱250', 'Per Hour']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-3xl font-black text-brand-pink">{v}</p>
                  <p className="text-white/60 text-sm">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-brand-pink via-brand-pink-light to-white flex items-center justify-center shadow-2xl pink-glow animate-float">
                <div className="text-center">
                  <svg viewBox="0 0 200 200" className="w-40 h-40 md:w-48 md:h-48 drop-shadow-xl">
                    <defs>
                      <radialGradient id="ballGrad" cx="38%" cy="35%" r="65%">
                        <stop offset="0%" stopColor="#F0FF60" />
                        <stop offset="60%" stopColor="#C8E600" />
                        <stop offset="100%" stopColor="#84A800" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="100" r="96" fill="url(#ballGrad)" />
                    <circle cx="100" cy="100" r="96" fill="none" stroke="#7A9600" strokeWidth="1.5" opacity="0.4" />
                    {/* Holes */}
                    {[
                      [100,38],[130,48],[152,68],[158,100],[148,130],[128,152],[100,160],[72,152],[52,130],[42,100],[48,68],[70,48],
                      [100,65],[122,72],[136,92],[132,116],[116,132],[94,136],[74,126],[62,108],[66,84],[82,70],
                      [100,88],[114,96],[116,112],[104,120],[90,116],[84,104],[88,92],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="5.5" fill="#6B8A00" opacity="0.55" />
                    ))}
                    <ellipse cx="78" cy="72" rx="22" ry="14" fill="white" opacity="0.15" transform="rotate(-35,78,72)" />
                  </svg>
                  <p className="text-brand-navy font-black text-lg mt-1">PICKLEBALL</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-brand-navy rounded-2xl shadow-xl p-4 text-white text-center">
                <p className="text-2xl font-black text-brand-lime">3</p>
                <p className="text-xs">Courts</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 text-center">
                <p className="text-brand-pink text-2xl font-black">6AM</p>
                <p className="text-brand-navy text-xs font-semibold">Opens Daily</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L60 69.3C120 58.7 240 37.3 360 32C480 26.7 600 37.3 720 42.7C840 48 960 48 1080 42.7C1200 37.3 1320 26.7 1380 21.3L1440 16V80H0Z" fill="white" /></svg>
        </div>
      </section>

      {/* ABOUT */}
      <section className="py-20 bg-white" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-brand-pink font-semibold text-sm uppercase tracking-widest">About Us</span>
              <h2 className="section-title mt-2 mb-6">Your Premier<br />Pickleball Destination</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Located at 1485 Mirafuentes Street, Suaybaguio District, Net N&apos; Paddle is where passion
                for pickleball meets exceptional facilities. From first-timers to seasoned players, we have the perfect court.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Flexible booking, affordable rates, and top-quality courts — open 7 days a week.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '📍', label: 'Location', value: 'Suaybaguio District' },
                  { icon: '📞', label: 'Phone / GCash', value: '09703778990' },
                  { icon: '🕐', label: 'Hours', value: '6 AM – 11 PM' },
                  { icon: '📅', label: 'Open', value: 'Mon – Sun' },
                ].map((i) => (
                  <div key={i.label} className="bg-brand-pink-light/40 rounded-2xl p-4">
                    <span className="text-2xl">{i.icon}</span>
                    <p className="text-xs text-gray-500 mt-1">{i.label}</p>
                    <p className="text-brand-navy font-semibold text-sm">{i.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { bg: 'bg-brand-pink', text: 'text-white', emoji: '☀️', title: 'Outdoor Courts', sub: 'Open Air' },
                { bg: 'bg-brand-lime', text: 'text-brand-navy', emoji: '🏓', title: '3 Courts', sub: 'Always Available' },
                { bg: 'bg-brand-navy', text: 'text-white', emoji: '₱', title: '₱250/hour', sub: 'Flat Rate' },
                { bg: 'bg-brand-pink-light', text: 'text-brand-navy', emoji: '🎯', title: 'All Levels', sub: 'Beginner to Pro' },
              ].map((c) => (
                <div key={c.title} className={`${c.bg} rounded-3xl p-6 flex flex-col justify-between aspect-square`}>
                  <span className="text-4xl">{c.emoji}</span>
                  <div>
                    <p className={`${c.text} font-bold text-lg leading-tight`}>{c.title}</p>
                    <p className={`${c.text} opacity-70 text-sm`}>{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COURTS */}
      <section className="py-20 bg-gray-50" id="courts">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-pink font-semibold text-sm uppercase tracking-widest">Our Courts</span>
            <h2 className="section-title mt-2">Choose Your Court</h2>
            <p className="text-gray-500 mt-3 text-lg">3 outdoor courts to suit every style of play</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURTS.map((c) => (
              <div key={c.id} className="card court-card group">
                <div className={`h-36 bg-gradient-to-br ${c.grad} flex items-center justify-center`}><PickleballIcon /></div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-brand-navy text-lg">{c.name}</h3>
                      <span className="text-xs text-gray-500">{c.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-pink font-black text-xl">₱{c.price}</p>
                      <p className="text-gray-400 text-xs">/hour</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-5">
                    {c.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-gray-600 text-xs">
                        <span className="w-1.5 h-1.5 bg-brand-lime rounded-full shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link to={`/booking?court=${c.id}`}
                    className="block w-full text-center bg-brand-navy hover:bg-brand-pink text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                    Book This Court
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 bg-white" id="pricing">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-pink font-semibold text-sm uppercase tracking-widest">Pricing</span>
            <h2 className="section-title mt-2">Affordable Rates</h2>
            <p className="text-gray-500 mt-3">No hidden fees. Pay only for what you book.</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-navy text-white">
                  {['Court', 'Type', 'Rate/Hour', '2 Hours', '3 Hours'].map((h) => (
                    <th key={h} className={`py-4 px-6 font-semibold text-sm ${h === 'Court' || h === 'Type' ? 'text-left' : 'text-center'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COURTS.map((c, i) => (
                  <tr key={c.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                    <td className="py-4 px-6 font-semibold text-brand-navy">{c.name}</td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        c.type === 'Indoor Premium' ? 'bg-brand-navy/10 text-brand-navy' :
                        c.type === 'Outdoor' ? 'bg-brand-lime/20 text-brand-lime-dark' : 'bg-brand-pink-light text-brand-pink-dark'
                      }`}>{c.type}</span>
                    </td>
                    <td className="py-4 px-6 text-center font-black text-brand-pink">₱{c.price}</td>
                    <td className="py-4 px-6 text-center text-gray-600 font-semibold">₱{c.price * 2}</td>
                    <td className="py-4 px-6 text-center text-gray-600 font-semibold">₱{c.price * 3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-400 text-sm mt-4">Rates apply every day · 6:00 AM – 11:00 PM</p>
          <div className="text-center mt-8">
            <Link to="/booking" className="btn-primary">Reserve Your Slot</Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-brand-navy" id="how-it-works">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-lime font-semibold text-sm uppercase tracking-widest">Process</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Book in 3 Easy Steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 step-line" />
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-24 h-24 rounded-full bg-brand-pink flex items-center justify-center mx-auto mb-6 shadow-lg pink-glow">
                  <span className="text-white font-black text-3xl">{s.n}</span>
                </div>
                <h3 className="text-white font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link to="/booking" className="btn-primary text-lg py-4 px-12">Start Booking Now</Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-20 bg-white" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-brand-pink font-semibold text-sm uppercase tracking-widest">Find Us</span>
            <h2 className="section-title mt-2">Location & Hours</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-100 rounded-3xl h-80 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">📍</div>
                <h3 className="text-brand-navy font-bold text-xl mb-2">Net N&apos; Paddle</h3>
                <p className="text-gray-600">1485 Mirafuentes Street</p>
                <p className="text-gray-600">Suaybaguio District</p>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-4 text-brand-pink font-semibold text-sm hover:underline">
                  Open in Google Maps →
                </a>
              </div>
            </div>

            <div className="space-y-5">
              {[
                { icon: '📍', title: 'Address', value: '1485 Mirafuentes St., Suaybaguio District' },
                { icon: '📞', title: 'Phone / GCash', value: '09703778990' },
                { icon: '🕐', title: 'Operating Hours', value: 'Monday – Sunday · 6:00 AM to 11:00 PM' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start p-5 bg-gray-50 rounded-2xl">
                  <div className="w-12 h-12 bg-brand-pink rounded-xl flex items-center justify-center text-2xl shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-brand-navy font-bold">{item.title}</p>
                    <p className="text-gray-600 text-sm mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="bg-brand-pink rounded-2xl p-6 text-white">
                <h3 className="font-bold text-xl mb-2">Ready to Play?</h3>
                <p className="text-white/80 text-sm mb-4">Book online or call us at 09703778990</p>
                <Link to="/booking" className="inline-block bg-white text-brand-pink font-bold py-3 px-8 rounded-full hover:bg-brand-pink-light transition-colors">
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
