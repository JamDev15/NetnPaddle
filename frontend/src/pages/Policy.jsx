import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const RULES = [
  'All players are required to book their court in advance to secure a reservation.',
  'Reservations may only be made through our official booking platform.',
  'Full payment is required to confirm and secure all bookings.',
  'All bookings are strictly non-cancellable and non-refundable.',
  'Book at your own risk. Please note that our courts are outdoors. While we do our best to provide a great playing experience, weather conditions such as rain, strong winds, extreme heat, and other natural factors may occasionally affect scheduled games. By making a reservation, players acknowledge and accept the possibility of weather-related disruptions.',
  'Rescheduling is permitted only in cases of weather-related disruptions that make the court unplayable, and is subject to court availability.',
  'Players who arrive late will still be required to end their session at the originally scheduled booking time.',
  'No-shows are not eligible for refunds, credits, or rebooking.',
  'By confirming a reservation, players acknowledge and agree to these booking terms and conditions.',
]

export default function Policy() {
  useEffect(() => {
    document.title = "Court Booking Policy — Net N' Paddle"
  }, [])

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="hero-gradient py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white">Court Booking Policy</h1>
          <p className="text-white/70 mt-2">Please read before making a reservation</p>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="card p-8">
            <ol className="space-y-5">
              {RULES.map((rule, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-brand-pink/10 text-brand-pink font-bold text-sm flex items-center justify-center">{i + 1}</span>
                  <p className="text-gray-700 text-sm leading-relaxed pt-1">{rule}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
