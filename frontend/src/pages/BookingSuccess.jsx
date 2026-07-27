import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function fmtTime(t) {
  if (!t) return '—'
  const h = parseInt(t) % 24
  const ap = h < 12 ? 'AM' : 'PM'
  const d = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${d}:00 ${ap}`
}

export default function BookingSuccess() {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    document.title = "Booking Confirmed — Net N' Paddle"
    const data = sessionStorage.getItem('confirmedBooking')
    if (!data) { navigate('/'); return }
    setBooking(JSON.parse(data))
  }, [navigate])

  if (!booking) return null

  const dateFmt = booking.date ? format(new Date(booking.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy') : '—'
  const isGcash = booking.paymentMethod === 'gcash'

  const details = [
    { icon: '🏓', label: 'Court', value: booking.courtName },
    { icon: '📅', label: 'Date', value: dateFmt },
    { icon: '🕐', label: 'Time', value: `${fmtTime(booking.timeStart)} – ${fmtTime(booking.timeEnd)}` },
    { icon: '⏱', label: 'Duration', value: `${booking.duration} hour${booking.duration > 1 ? 's' : ''}` },
    { icon: '💰', label: 'Total', value: `₱${booking.totalAmount?.toLocaleString()}` },
    { icon: '💳', label: 'Payment', value: isGcash ? 'GCash' : 'Cash at Venue' },
    { icon: '👤', label: 'Name', value: booking.customerName },
    { icon: '📞', label: 'Phone', value: booking.customerPhone },
  ]

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="hero-gradient py-16 text-center">
          <div className="w-20 h-20 bg-brand-lime rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">Booking {isGcash ? 'Submitted!' : 'Received!'}</h1>
          <p className="text-white/70 mt-2 max-w-md mx-auto">
            {isGcash
              ? 'Admin will confirm after verifying your GCash payment.'
              : 'Please pay at the venue. Present this reference number.'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="card p-8 text-center mb-6">
            <p className="text-gray-500 text-sm mb-2">Booking Reference</p>
            <p className="text-3xl md:text-4xl font-black text-brand-pink tracking-widest">{booking.referenceNumber}</p>
            <p className="text-xs text-gray-400 mt-2">Save this number for your records</p>
          </div>

          <div className={`rounded-2xl p-4 mb-6 flex items-center gap-3 ${isGcash ? 'bg-yellow-50 border border-yellow-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${isGcash ? 'bg-yellow-100' : 'bg-orange-100'}`}>
              {isGcash ? '⏳' : '💵'}
            </div>
            <div>
              <p className={`font-bold ${isGcash ? 'text-yellow-800' : 'text-orange-800'}`}>
                {isGcash ? 'Pending Payment Confirmation' : 'Pending Cash Payment'}
              </p>
              <p className={`text-sm ${isGcash ? 'text-yellow-700' : 'text-orange-700'}`}>
                {isGcash ? `GCash Ref: ${booking.gcashReference || 'N/A'} — admin will confirm shortly` : `Pay ₱${booking.totalAmount?.toLocaleString()} at the venue`}
              </p>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="font-bold text-brand-navy text-lg mb-5">Booking Details</h3>
            <div className="space-y-4">
              {details.map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                  <span className="text-xl w-8">{icon}</span>
                  <span className="text-gray-500 w-24 shrink-0 text-sm">{label}</span>
                  <span className="font-semibold text-brand-navy text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-navy rounded-2xl p-6 mb-8 text-white">
            <h3 className="font-bold text-brand-lime mb-3">📋 Reminders</h3>
            <ul className="text-sm text-white/80 space-y-2">
              <li>• Arrive at least 10–15 minutes before your session</li>
              <li>• Bring your own paddle or rent one at the venue</li>
              <li>• Wear proper court shoes</li>
              {!isGcash && <li>• Present reference <strong>{booking.referenceNumber}</strong> at the front desk</li>}
              <li>• For changes call 09703778990</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/booking" className="btn-primary text-center flex-1 py-4">Book Another Court</Link>
            <Link to="/" className="btn-navy text-center flex-1 py-4">Back to Home</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
