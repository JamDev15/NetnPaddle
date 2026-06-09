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
                    { id: 'gcash', icon: '📱', label: 'InstaPay / QR', sub: 'GCash, Maya, any bank' },
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
                  <div className="bg-cyan-50 rounded-2xl p-5 space-y-4 border border-cyan-200">
                    <h3 className="font-bold text-cyan-800">InstaPay / GoTyme Bank</h3>
                    <ol className="text-sm text-cyan-700 space-y-1.5 list-decimal list-inside">
                      <li>Open your banking app (GCash, Maya, any bank)</li>
                      <li>Tap <strong>Send Money → Scan QR</strong></li>
                      <li>Scan the QR code below</li>
                      <li>Enter amount: <strong className="text-brand-pink text-base">₱{booking.totalAmount?.toLocaleString()}</strong></li>
                      <li>Complete the transfer and copy your <strong>Reference Number</strong></li>
                    </ol>

                    {/* QR Code */}
                    <div className="bg-white rounded-2xl p-4 flex flex-col items-center border-2 border-cyan-200">
                      <img src="/payment-qr.png" alt="InstaPay QR Code"
                        className="w-52 h-52 object-contain rounded-xl"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                      <div style={{ display: 'none' }} className="w-52 h-52 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm text-center p-4">
                        Save QR image as<br /><code className="font-mono text-xs">frontend/public/payment-qr.png</code>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="font-black text-brand-navy text-sm">FELBEN CARLO RIMANDO</p>
                        <p className="text-xs text-gray-500">GoTyme Bank · ••••••• 9528</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-blue-600 font-bold text-xs">insta</span>
                          <span className="text-red-500 font-bold text-xs">Pay</span>
                          <span className="text-gray-400 text-xs">· Transfer fees may apply</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-cyan-800 mb-2">Reference Number *</label>
                      <input value={gcashRef} onChange={(e) => setGcashRef(e.target.value)}
                        placeholder="e.g. 1234567890123" className="input-field bg-white" />
                      <p className="text-xs text-cyan-600 mt-1">Enter the reference number from your bank app after sending payment</p>
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
                  {loading ? 'Processing...' : method === 'gcash' ? 'Confirm Booking & InstaPay' : 'Confirm Booking (Cash)'}
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
