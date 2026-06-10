import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api, UPLOADS_BASE } from '../utils/api'

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
  const [gcashRef, setGcashRef] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  useEffect(() => {
    document.title = "Payment — Net N' Paddle"
    const data = sessionStorage.getItem('pendingBooking')
    if (!data) { navigate('/booking'); return }
    setBooking(JSON.parse(data))
  }, [navigate])

  const handleSubmit = async () => {
    if (!screenshot) return toast.error('Please upload your payment screenshot')
    setLoading(true)
    try {
      // Step 1: create booking
      const created = await api.post('/bookings/', {
        ...booking,
        paymentMethod: 'instapay',
        gcashReference: gcashRef,
      })

      // Step 2: upload screenshot
      const formData = new FormData()
      formData.append('file', screenshot)
      await fetch(`${UPLOADS_BASE}/api/bookings/${created.id}/screenshot`, {
        method: 'POST',
        body: formData,
      })

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
        {/* Header */}
        <div className="hero-gradient py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white">Complete Payment</h1>
          <p className="text-white/70 mt-2">Scan the QR code below to pay via InstaPay</p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Payment Section */}
            <div className="lg:col-span-3">
              <div className="card p-6">

                {/* GoTyme Header */}
                <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center text-white font-black text-lg shadow">
                    GT
                  </div>
                  <div>
                    <h2 className="font-bold text-brand-navy text-xl">GoTyme Bank</h2>
                    <p className="text-gray-500 text-sm">Pay via InstaPay — works with any bank app</p>
                  </div>
                </div>

                {/* Amount highlight */}
                <div className="bg-brand-pink/5 border-2 border-brand-pink/20 rounded-2xl p-4 mb-6 text-center">
                  <p className="text-gray-500 text-sm mb-1">Amount to Pay</p>
                  <p className="text-4xl font-black text-brand-pink">₱{booking.totalAmount?.toLocaleString()}</p>
                </div>

                {/* Steps */}
                <ol className="space-y-2 mb-6">
                  {[
                    'Open your banking app (GCash, Maya, BDO, BPI, etc.)',
                    'Tap Send Money → Scan QR',
                    `Scan the QR code below and enter ₱${booking.totalAmount?.toLocaleString()}`,
                    'Complete the transfer',
                    'Copy your Reference Number and enter it below',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                {/* QR Code */}
                <div className="bg-white rounded-3xl border-2 border-cyan-200 p-5 flex flex-col items-center mb-6 shadow-sm">
                  <img
                    src="/payment-qr.jpg"
                    alt="GoTyme Bank InstaPay QR Code"
                    className="w-64 h-64 object-contain rounded-2xl"
                  />
                  <div className="mt-4 text-center">
                    <p className="font-black text-brand-navy text-base tracking-wide">FELBEN CARLO RIMANDO</p>
                    <p className="text-gray-500 text-sm mt-0.5">GoTyme Bank · ••••••• 9528</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <span className="text-blue-600 font-bold text-sm">insta</span>
                      <span className="text-red-500 font-bold text-sm">Pay</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">Transfer fees may apply</p>
                  </div>
                </div>

                {/* Reference Number */}
                <div className="mb-5">
                  <label className="block text-sm font-bold text-brand-navy mb-2">
                    Reference Number (optional)
                  </label>
                  <input
                    value={gcashRef}
                    onChange={(e) => setGcashRef(e.target.value)}
                    placeholder="e.g. 1234567890123"
                    className="input-field"
                  />
                </div>

                {/* Screenshot Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-brand-navy mb-2">
                    Upload Payment Screenshot <span className="text-brand-pink">*</span>
                  </label>

                  {!preview ? (
                    <label
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-brand-pink/40 rounded-2xl bg-brand-pink/5 hover:bg-brand-pink/10 cursor-pointer transition-colors"
                    >
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <div className="text-center px-4">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-sm font-semibold text-brand-navy">Tap to upload screenshot</p>
                        <p className="text-xs text-gray-400 mt-1">or drag and drop here</p>
                        <p className="text-xs text-gray-400">JPG, PNG, HEIC accepted</p>
                      </div>
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-brand-lime">
                      <img src={preview} alt="Payment screenshot" className="w-full max-h-64 object-contain bg-gray-50" />
                      <button
                        type="button"
                        onClick={() => { setScreenshot(null); setPreview(null) }}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-600 transition-colors shadow"
                      >
                        ×
                      </button>
                      <div className="bg-brand-lime/20 py-2 px-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-brand-lime-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-brand-lime-dark">Screenshot ready to upload</span>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Take a screenshot of your payment confirmation and upload it here
                  </p>
                </div>

                {/* Confirm Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !screenshot}
                  className="w-full bg-brand-pink hover:bg-brand-pink-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-lg shadow-lg"
                >
                  {loading ? 'Uploading & Confirming...' : 'Confirm Booking & Submit Payment'}
                </button>

                <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Your booking is secured once confirmed
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-24">
                <h3 className="font-bold text-brand-navy text-lg mb-5 pb-4 border-b border-gray-100">
                  Booking Summary
                </h3>
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
                    <div key={l} className="flex justify-between gap-2">
                      <span className="text-gray-500 shrink-0">{l}</span>
                      <span className="font-semibold text-brand-navy text-right">{v}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-brand-navy">Total</span>
                    <span className="text-2xl font-black text-brand-pink">
                      ₱{booking.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* GoTyme info in sidebar */}
                <div className="mt-6 bg-cyan-50 rounded-2xl p-4 text-center border border-cyan-200">
                  <p className="text-xs text-gray-500 mb-1">Send payment to</p>
                  <p className="font-black text-brand-navy text-sm">FELBEN CARLO RIMANDO</p>
                  <p className="text-xs text-gray-500">GoTyme Bank</p>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400">Need help?</p>
                  <a href="tel:09703778990" className="text-brand-pink font-bold text-sm">
                    📞 09703778990
                  </a>
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
