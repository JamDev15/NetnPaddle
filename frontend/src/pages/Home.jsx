import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const COURTS = [
  { id: 'court-a', name: 'Court A', type: 'Indoor Standard', price: 200, emoji: '🏓',
    features: ['Professional flooring', 'LED lighting', 'Climate controlled', 'Seating area'],
    grad: 'from-brand-pink to-brand-pink-dark' },
  { id: 'court-b', name: 'Court B', type: 'Indoor Standard', price: 200, emoji: '🏓',
    features: ['Professional flooring', 'LED lighting', 'Climate controlled', 'Seating area'],
    grad: 'from-brand-navy to-brand-navy-light' },
  { id: 'court-c', name: 'Court C', type: 'Indoor Premium', price: 280, emoji: '⭐',
    features: ['Cushioned sports floor', 'Enhanced lighting', 'Private lounge', 'Equipment storage'],
    grad: 'from-purple-600 to-purple-800' },
  { id: 'court-d', name: 'Court D', type: 'Outdoor', price: 150, emoji: '☀️',
    features: ['Open-air design', 'Natural lighting', 'Shaded spectator area', 'Parking nearby'],
    grad: 'from-brand-lime-dark to-green-600' },
]

const STEPS = [
  { n: '01', title: 'Choose Your Court', desc: "Browse 4 courts — indoor, premium, or outdoor — and pick the one that fits your game." },
  { n: '02', title: 'Pick Date & Time', desc: "Select your preferred date and available slot. We're open 6 AM–11 PM every day." },
  { n: '03', title: 'Pay & Confirm', desc: "Pay via GCash or cash at the venue. Receive instant confirmation with a reference number." },
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
              Suaybaguio District&apos;s premier pickleball destination. 4 pro-quality courts, open daily
              6 AM–11 PM. Book online in minutes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking" className="btn-primary text-base py-4 px-10 animate-pulse-pink">Book a Court Now</Link>
              <a href="#courts" className="btn-outline text-base py-4 px-10">View Courts</a>
            </div>

            <div className="flex flex-wrap gap-8 mt-12 pt-12 border-t border-white/10">
              {[['4', 'Courts'], ['7', 'Days/Week'], ['17hrs', 'Daily'], ['₱150+', 'Per Hour']].map(([v, l]) => (
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
                  <div className="text-8xl md:text-9xl">🎾</div>
                  <p className="text-brand-navy font-black text-lg mt-2">PICKLEBALL</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-brand-navy rounded-2xl shadow-xl p-4 text-white text-center">
                <p className="text-2xl font-black text-brand-lime">4</p>
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
                { bg: 'bg-brand-pink', text: 'text-white', emoji: '🏓', title: 'Indoor Courts', sub: 'Climate Controlled' },
                { bg: 'bg-brand-lime', text: 'text-brand-navy', emoji: '☀️', title: 'Outdoor Court', sub: 'Open Air' },
                { bg: 'bg-brand-navy', text: 'text-white', emoji: '⭐', title: 'Premium Court', sub: 'Cushioned Floor' },
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
            <p className="text-gray-500 mt-3 text-lg">4 courts to suit every style of play</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURTS.map((c) => (
              <div key={c.id} className="card court-card group">
                <div className={`h-36 bg-gradient-to-br ${c.grad} flex items-center justify-center text-6xl`}>{c.emoji}</div>
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
