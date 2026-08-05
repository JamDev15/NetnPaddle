import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { api } from '../utils/api'

const DURATIONS = [1, 2, 3]
const START_HOUR = 0
const END_HOUR = 23

// ₱200/hr up to and including the 5-6pm slot, ₱250/hr from 6pm onwards
const RATE_BEFORE_6PM = 200
const RATE_FROM_6PM = 250

function timeLabel(h) {
  const hh = h % 24
  const ap = hh < 12 ? 'AM' : 'PM'
  const d = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return `${d}:00 ${ap}`
}

function hourlyRate(h) {
  return (h % 24) < 18 ? RATE_BEFORE_6PM : RATE_FROM_6PM
}

function computeTotal(startHour, duration) {
  let total = 0
  for (let i = 0; i < duration; i++) total += hourlyRate(startHour + i)
  return total
}

const GRAD = {
  'court-1': 'from-brand-pink to-brand-pink-dark',
  'court-2': 'from-brand-navy to-brand-navy-light',
  'court-3': 'from-brand-lime-dark to-green-600',
}

export default function Booking() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselect = searchParams.get('court')

  const [courts, setCourts] = useState([])
  const [court, setCourt] = useState(null)
  const [date, setDate] = useState(addDays(new Date(), 1))
  const [hour, setHour] = useState(null)
  const [duration, setDuration] = useState(1)
  const [bookedSlots, setBookedSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [allCourtsSlots, setAllCourtsSlots] = useState({})
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', notes: '' })
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)
  const [bookingsOpen, setBookingsOpen] = useState(true)
  const [closedMessage, setClosedMessage] = useState('')
  const [closedPeriods, setClosedPeriods] = useState([])

  const refreshClosureStatus = () => {
    api.get('/settings/booking-status').then((data) => {
      setBookingsOpen(data.bookingsOpen)
      setClosedMessage(data.closedMessage || '')
    }).catch(() => {})
    api.get('/settings/closed-periods').then(setClosedPeriods).catch(() => {})
  }

  useEffect(() => {
    document.title = "Book a Court — Net N' Paddle"
    api.get('/courts/').then((data) => {
      setCourts(data)
      if (preselect) {
        const found = data.find((c) => c.id === preselect)
        if (found) setCourt(found)
      }
    })
    refreshClosureStatus()
  }, [preselect])

  // Re-check closure status whenever the tab regains focus, so a tab left open
  // doesn't keep showing stale availability after an admin closes dates elsewhere.
  useEffect(() => {
    const onFocus = () => refreshClosureStatus()
    const onVisibilityChange = () => { if (!document.hidden) onFocus() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const periodsForDate = (dateStr) => closedPeriods.filter((p) => dateStr >= p.startDate && dateStr <= p.endDate)

  // Whole-day closure (no time range set) — blocks the entire date
  const getDateClosedReason = (dateStr) => {
    const period = periodsForDate(dateStr).find((p) => !p.startTime || !p.endTime)
    return period ? (period.reason || 'Closed') : null
  }

  // Per-hour closure — either a whole-day closure, or a partial closure covering this hour
  const getHourClosedReason = (dateStr, h) => {
    for (const p of periodsForDate(dateStr)) {
      if (!p.startTime || !p.endTime) return p.reason || 'Closed'
      const startHour = parseInt(p.startTime)
      const endHour = parseInt(p.endTime)
      if (h >= startHour && h < endHour) return p.reason || 'Closed'
    }
    return null
  }

  const selectedDateStr = format(date, 'yyyy-MM-dd')
  const dateClosedReason = getDateClosedReason(selectedDateStr)
  const effectivelyClosed = !bookingsOpen || !!dateClosedReason
  const closedBannerMessage = !bookingsOpen ? closedMessage : dateClosedReason
  const partialClosures = bookingsOpen && !dateClosedReason
    ? periodsForDate(selectedDateStr).filter((p) => p.startTime && p.endTime)
    : []

  useEffect(() => {
    if (!court || !date) return
    setLoadingSlots(true)
    const dateStr = format(date, 'yyyy-MM-dd')
    api.get(`/bookings/availability?courtId=${court.id}&date=${dateStr}`)
      .then((d) => { setBookedSlots(d.bookedSlots || []) })
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [court, date])

  useEffect(() => {
    if (!courts.length || !date) return
    const dateStr = format(date, 'yyyy-MM-dd')
    Promise.all(courts.map((c) =>
      api.get(`/bookings/availability?courtId=${c.id}&date=${dateStr}`)
        .then((d) => [c.id, d.bookedSlots || []])
        .catch(() => [c.id, []])
    )).then((entries) => setAllCourtsSlots(Object.fromEntries(entries)))
  }, [courts, date])

  const isAvail = (h) => {
    if (h + duration > 24) return false
    for (let i = 0; i < duration; i++) {
      if (bookedSlots.includes(h + i)) return false
      if (getHourClosedReason(selectedDateStr, h + i)) return false
    }
    return true
  }

  const total = hour !== null ? computeTotal(hour, duration) : 0
  const rates = hour !== null ? Array.from({ length: duration }, (_, i) => hourlyRate(hour + i)) : []
  const rateLabel = rates.length === 0
    ? (court ? `₱${RATE_BEFORE_6PM}–${RATE_FROM_6PM}/hr` : '—')
    : (new Set(rates).size === 1 ? `₱${rates[0]}/hr` : `₱${Math.min(...rates)}–${Math.max(...rates)}/hr`)

  const handleProceed = () => {
    if (effectivelyClosed) return toast.error(closedBannerMessage || 'Bookings are temporarily closed')
    if (!court) return toast.error('Please select a court')
    if (hour === null) return toast.error('Please select a time slot')
    if (!form.customerName.trim()) return toast.error('Please enter your name')
    if (!form.customerPhone.trim()) return toast.error('Please enter your phone number')
    if (!agreedToPolicy) return toast.error('Please agree to the Court Booking Policy')

    const booking = {
      courtId: court.id,
      courtName: `${court.name} — ${court.type}`,
      date: format(date, 'yyyy-MM-dd'),
      timeStart: `${String(hour).padStart(2, '0')}:00`,
      duration,
      pricePerHour: Math.round(total / duration),
      totalAmount: total,
      ...form,
    }
    sessionStorage.setItem('pendingBooking', JSON.stringify(booking))
    navigate('/payment')
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="hero-gradient py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white">Book a Court</h1>
          <p className="text-white/70 mt-2">Complete the form below to reserve your slot</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {!bookingsOpen && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
              <p className="font-black text-red-600 text-lg">Bookings Are Currently Closed</p>
              <p className="text-red-500 text-sm mt-1">{closedMessage || "We're not accepting new bookings right now. Please check back later."}</p>
            </div>
          )}
          {bookingsOpen && dateClosedReason && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
              <p className="font-black text-red-600 text-lg">{format(date, 'MMMM d, yyyy')} Is Closed</p>
              <p className="text-red-500 text-sm mt-1">{dateClosedReason}. Please pick a different date.</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

              {/* Step 1 */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center font-bold text-sm">1</div>
                  <h2 className="font-bold text-brand-navy text-xl">Select Court</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courts.map((c) => (
                    <button key={c.id} onClick={() => { setCourt(c); setHour(null) }}
                      className={`text-left rounded-2xl border-2 overflow-hidden transition-all ${court?.id === c.id ? 'border-brand-pink shadow-lg scale-[1.02]' : 'border-gray-200 hover:border-brand-pink/50'}`}>
                      <div className={`h-20 bg-gradient-to-r ${GRAD[c.id] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
                        <span className="text-white font-black text-3xl">{c.name}</span>
                      </div>
                      <div className="p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-brand-navy">{c.name}</p>
                            <p className="text-gray-500 text-xs">{c.type}</p>
                          </div>
                          <p className="text-brand-pink font-black text-lg">₱{RATE_BEFORE_6PM}–{RATE_FROM_6PM}<span className="text-xs text-gray-400 font-normal">/hr</span></p>
                        </div>
                        {court?.id === c.id && (
                          <div className="mt-2 flex items-center gap-1 text-brand-pink text-xs font-semibold">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Selected
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center font-bold text-sm">2</div>
                  <h2 className="font-bold text-brand-navy text-xl">Pick Date & Time</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <DatePicker selected={date} onChange={(d) => { setDate(d); setHour(null) }}
                      minDate={new Date()} dateFormat="MMMM d, yyyy"
                      excludeDateIntervals={closedPeriods.filter((p) => !p.startTime || !p.endTime).map((p) => {
                        const [sy, sm, sd] = p.startDate.split('-').map(Number)
                        const [ey, em, ed] = p.endDate.split('-').map(Number)
                        return { start: new Date(sy, sm - 1, sd), end: new Date(ey, em - 1, ed) }
                      })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                    <div className="flex gap-2">
                      {DURATIONS.map((d) => (
                        <button key={d} onClick={() => { setDuration(d); setHour(null) }}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${duration === d ? 'border-brand-pink bg-brand-pink text-white' : 'border-gray-200 text-gray-600 hover:border-brand-pink'}`}>
                          {d}hr{d > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6 overflow-x-auto">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Court Availability — {format(date, 'MMM d, yyyy')}
                  </label>
                  {partialClosures.length > 0 && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                      {partialClosures.map((p) => `${timeLabel(parseInt(p.startTime))} – ${timeLabel(parseInt(p.endTime))}${p.reason ? ` (${p.reason})` : ''}`).join(' · ')} closed on this date.
                    </p>
                  )}
                  <table className="w-full text-sm border-separate border-spacing-0 rounded-xl overflow-hidden border border-gray-200">
                    <thead>
                      <tr>
                        <th className="bg-brand-navy text-white text-xs font-bold py-2 px-3 text-left">Time</th>
                        {courts.map((c) => (
                          <th key={c.id} className="bg-brand-navy text-white text-xs font-bold py-2 px-3 text-center">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h) => {
                        const hourClosed = effectivelyClosed || !!getHourClosedReason(selectedDateStr, h)
                        return (
                        <tr key={h} className="border-t border-gray-100">
                          <td className="bg-brand-navy/90 text-white text-xs font-semibold py-2 px-3 whitespace-nowrap">{timeLabel(h)} – {timeLabel(h + 1)}</td>
                          {courts.map((c) => {
                            if (hourClosed) {
                              return (
                                <td key={c.id} className="text-center text-xs font-semibold py-2 px-3 bg-gray-100 text-gray-400">
                                  Closed
                                </td>
                              )
                            }
                            const booked = (allCourtsSlots[c.id] || []).includes(h)
                            return (
                              <td key={c.id} className={`text-center text-xs font-semibold py-2 px-3 ${booked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                                {booked ? 'Booked' : 'Available'}
                              </td>
                            )
                          })}
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {court ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Available Time Slots
                      {loadingSlots && <span className="text-brand-pink ml-2 text-xs animate-pulse">Loading...</span>}
                    </label>
                    <p className="text-xs text-gray-400 mb-3">₱{RATE_BEFORE_6PM}/hr until 6:00 PM · ₱{RATE_FROM_6PM}/hr from 6:00 PM onwards</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i).map((h) => {
                        const avail = isAvail(h) && !effectivelyClosed
                        const sel = hour === h
                        return (
                          <button key={h} disabled={!avail} onClick={() => setHour(h)}
                            className={`time-slot ${!avail ? 'booked' : ''} ${sel ? 'selected' : ''}`}>
                            {timeLabel(h)}
                          </button>
                        )
                      })}
                    </div>
                    <div className="flex gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-brand-pink inline-block" /> Selected</span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Booked</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-4xl mb-2">🏓</p>
                    <p className="text-sm">Select a court above to see time slots</p>
                  </div>
                )}
              </div>

              {/* Step 3 */}
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center font-bold text-sm">3</div>
                  <h2 className="font-bold text-brand-navy text-xl">Your Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      placeholder="Juan dela Cruz" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                    <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      placeholder="09XXXXXXXXX" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
                    <input value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      placeholder="juan@email.com" className="input-field" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3} className="input-field resize-none" placeholder="Any special requests..." />
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-6 p-4 bg-gray-50 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={agreedToPolicy}
                    onChange={(e) => setAgreedToPolicy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-brand-pink shrink-0" />
                  <span className="text-sm text-gray-600">
                    I have read and agree to the{' '}
                    <Link to="/policy" target="_blank" className="text-brand-pink font-semibold hover:underline">
                      Court Booking Policy
                    </Link>, including the non-cancellable, non-refundable, and weather-related terms.
                  </span>
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h3 className="font-bold text-brand-navy text-lg mb-5 pb-4 border-b border-gray-100">Summary</h3>
                <div className="space-y-4 text-sm">
                  {[
                    ['Court', court ? court.name : '—'],
                    ['Type', court ? court.type : '—'],
                    ['Date', format(date, 'MMM d, yyyy')],
                    ['Time', hour !== null ? `${timeLabel(hour)} – ${timeLabel(hour + duration)}` : '—'],
                    ['Duration', `${duration} hour${duration > 1 ? 's' : ''}`],
                    ['Rate', rateLabel],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-gray-500">{l}</span>
                      <span className="font-semibold text-brand-navy text-right">{v}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="font-bold text-brand-navy">Total</span>
                    <span className="text-2xl font-black text-brand-pink">{hour !== null ? `₱${total.toLocaleString()}` : '—'}</span>
                  </div>
                </div>

                <button onClick={handleProceed}
                  disabled={effectivelyClosed || !court || hour === null || !form.customerName || !form.customerPhone || !agreedToPolicy}
                  className="w-full mt-6 bg-brand-pink hover:bg-brand-pink-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-colors text-lg">
                  {effectivelyClosed ? 'Bookings Closed' : 'Proceed to Payment →'}
                </button>

                <p className="text-center text-gray-400 text-xs mt-4">🔒 Secure — no payment collected now</p>

                <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">Need help?</p>
                  <a href="tel:09703778990" className="text-brand-pink font-bold text-sm">📞 09703778990</a>
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
