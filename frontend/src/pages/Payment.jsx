import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api } from '../utils/api'

function fmtTime(t) {
  if (!t) return '—'
  const h = parseInt(t)
  const ap = h < 12 ? 'AM' : 'PM'
  const d = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${d}:00 ${ap}`
}

export default function Payment() {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [method, setMethod] = useState('gcash')
  const [gcashRef, setGcashRef] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = "Payment — Net N' Paddle"
    const data = sessionStorage.getItem('pendingBooking')
    if (!data) { navigate('/booking'); return }
    setBooking(JSON.parse(data))
  }, [navigate])

  const handleSubmit = async () => {
    if (method === 'gcash' && !gcashRef.trim()) return toast.error('Enter your GCash reference number')
    setLoading(true)
    try {
      const created = await api.post('/bookings/', { ...booking, paymentMethod: method, gcashReference: gcashRef })
      sessionStorage.removeItem('pendingBooking')
      sessionStorage.setItem('confirmedBooking', JSON.stringify(created))
      navigate('/booking-success')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!booking) return null

  const dateFmt = booking.date ? format(new Date(booking.date + 'T00:00:00'), 'MMMM d, yyyy') : '—'
  const endHour = booking.timeStart ? parseInt(booking.timeStart) + booking.duration : 0
  const timeEnd = fmtTime(`${String(endHour).padStart(2, '0')}:00`)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="hero-gradient py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white">Complete Payment</h1>
          <p className="text-white/70 mt-2">Choose your payment method below</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            <div className="lg:col-span-3 space-y-6">
              <div className="card p-6">
                <h2 className="font-bold text-brand-navy text-xl mb-6">Payment Method</h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { id: 'gcash', icon: '💙', label: 'GCash', sub: 'Online payment' },
                    { id: 'cash', icon: '💵', label: 'Cash', sub: 'Pay at venue' },
                  ].map((m) => (
                    <button key={m.id} onClick={() => setMethod(m.id)}
                      className={`relative p-5 rounded-2xl border-2 text-center transition-all ${method === m.id ? 'border-brand-pink bg-brand-pink/5' : 'border-gray-200 hover:border-brand-pink/50'}`}>
                      {method === m.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand-pink rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="text-4xl mb-2">{m.icon}</div>
                      <p className="font-bold text-brand-navy">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
                    </button>
                  ))}
                </div>

                {method === 'gcash' && (
                  <div className="bg-blue-50 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-blue-800">GCash Payment Instructions</h3>
                    <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                      <li>Open your GCash app</li>
                      <li>Send <strong>₱{booking.totalAmount?.toLocaleString()}</strong> to:</li>
                    </ol>
                    <div className="bg-white rounded-xl p-4 text-center border-2 border-blue-200">
                      <p className="text-xs text-gray-500 mb-1">GCash Number</p>
                      <p className="text-3xl font-black text-blue-600 tracking-widest">0970 377 8990</p>
                      <p className="text-xs text-gray-500 mt-1">Net N&apos; Paddle</p>
                    </div>
                    <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside" start={3}>
                      <li>Copy your <strong>Reference Number</strong> from GCash</li>
                      <li>Enter it below and click Confirm</li>
                    </ol>
                    <div>
                      <label className="block text-sm font-semibold text-blue-800 mb-2">GCash Reference Number *</label>
                      <input value={gcashRef} onChange={(e) => setGcashRef(e.target.value)}
                        placeholder="e.g. 1234567890123" className="input-field bg-white" />
                    </div>
                  </div>
                )}

                {method === 'cash' && (
                  <div className="bg-orange-50 rounded-2xl p-5">
                    <h3 className="font-bold text-orange-800 mb-3">Pay at Venue</h3>
                    <ul className="text-sm text-orange-700 space-y-2">
                      <li>• Your booking will be marked as <strong>pending</strong></li>
                      <li>• Arrive at least 15 minutes early</li>
                      <li>• Pay <strong>₱{booking.totalAmount?.toLocaleString()}</strong> in cash at the front desk</li>
                      <li>• Present your booking reference number</li>
                    </ul>
                  </div>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full mt-6 bg-brand-pink hover:bg-brand-pink-dark disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl transition-colors text-lg">
                  {loading ? 'Processing...' : method === 'gcash' ? 'Confirm Booking & Payment' : 'Confirm Booking (Cash)'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card p-6">
                <h3 className="font-bold text-brand-navy text-lg mb-5 pb-4 border-b border-gray-100">Order Summary</h3>
                <div className="space-y-3 text-sm">
                  {[
                    ['Court', booking.courtName],
                    ['Date', dateFmt],
                    ['Time', `${fmtTime(booking.timeStart)} – ${timeEnd}`],
                    ['Duration', `${booking.duration} hour${booking.duration > 1 ? 's' : ''}`],
                    ['Rate', `₱${booking.pricePerHour}/hr`],
                    ['Player', booking.customerName],
                    ['Phone', booking.customerPhone],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-gray-500">{l}</span>
                      <span className="font-semibold text-brand-navy text-right max-w-[60%]">{v}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-brand-navy">Total</span>
                    <span className="text-2xl font-black text-brand-pink">₱{booking.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">Questions?</p>
                  <a href="tel:09703778990" className="text-brand-pink font-bold">09703778990</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
