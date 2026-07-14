import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { api, imgUrl } from '../../utils/api'

const STATUS = {
  pending:      { label: 'Pending Payment', cls: 'badge-pending' },
  pending_cash: { label: 'Pending Cash',    cls: 'badge-cash' },
  confirmed:    { label: 'Confirmed',       cls: 'badge-confirmed' },
  completed:    { label: 'Completed',       cls: 'badge-completed' },
  cancelled:    { label: 'Cancelled',       cls: 'badge-cancelled' },
}

function fmtTime(t) {
  if (!t) return ''
  const h = parseInt(t)
  const ap = h < 12 ? 'AM' : 'PM'
  const d = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${d}:00 ${ap}`
}

function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'badge-pending' }
  return <span className={s.cls}>{s.label}</span>
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [section, setSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [calMonth, setCalMonth] = useState(new Date())
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', timeStart: '', duration: 1, courtId: '', courtName: '' })
  const [courts, setCourts] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const today = format(new Date(), 'yyyy-MM-dd')
  const SCHEDULE_START_HOUR = 6
  const SCHEDULE_END_HOUR = 22

  const fetchBookings = useCallback(async () => {
    try {
      const data = await api.adminGet('/bookings/')
      setBookings(data)
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
      } else {
        toast.error('Failed to load bookings')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    document.title = "Admin Dashboard — Net N' Paddle"
    fetchBookings()
    api.get('/courts/').then(setCourts).catch(() => {})
  }, [fetchBookings])

  useEffect(() => {
    if (!rescheduleModal) return
    const { courtId, date } = rescheduleForm
    if (!courtId || !date) { setBookedSlots([]); return }
    api.get(`/bookings/availability?courtId=${courtId}&date=${date}`)
      .then((d) => setBookedSlots((d.bookedSlots || []).filter((h) => {
        const s = parseInt(rescheduleModal.timeStart)
        const dur = rescheduleModal.duration
        return !(h >= s && h < s + dur)
      })))
      .catch(() => setBookedSlots([]))
  }, [rescheduleForm.courtId, rescheduleForm.date, rescheduleModal])

  const openReschedule = (b) => {
    setRescheduleForm({
      date: b.date,
      timeStart: b.timeStart,
      duration: b.duration,
      courtId: b.courtId,
      courtName: b.courtName,
    })
    setRescheduleModal(b)
  }

  const submitReschedule = async () => {
    const { date, timeStart, duration, courtId, courtName } = rescheduleForm
    if (!date || !timeStart || !courtId) return toast.error('Fill in all fields')
    setUpdating(true)
    try {
      const updated = await api.adminPut(`/bookings/${rescheduleModal.id}`, { date, timeStart, duration: Number(duration), courtId, courtName })
      toast.success('Booking rescheduled!')
      await fetchBookings()
      setRescheduleModal(null)
      if (selected?.id === rescheduleModal.id) setSelected(updated)
    } catch (e) { toast.error(e.message || 'Reschedule failed') }
    finally { setUpdating(false) }
  }

  function timeLabel(h) {
    const ap = h < 12 ? 'AM' : 'PM'
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${d}:00 ${ap}`
  }

  function slotAvailable(h) {
    const dur = Number(rescheduleForm.duration)
    if (h + dur > 23) return false
    for (let i = 0; i < dur; i++) if (bookedSlots.includes(h + i)) return false
    return true
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  const updateStatus = async (id, status) => {
    setUpdating(true)
    try {
      await api.adminPut(`/bookings/${id}`, { status })
      toast.success(`Booking ${status}`)
      await fetchBookings()
      if (selected?.id === id) setSelected((p) => ({ ...p, status }))
    } catch { toast.error('Update failed') }
    finally { setUpdating(false) }
  }

  const cancelBooking = async (id) => {
    if (!confirm('Delete this booking? It will move to Deleted Bookings.')) return
    setUpdating(true)
    try {
      await api.adminDelete(`/bookings/${id}`)
      toast.success('Booking cancelled')
      await fetchBookings()
      if (selected?.id === id) setSelected(null)
    } catch { toast.error('Cancel failed') }
    finally { setUpdating(false) }
  }

  const deleteBooking = async (id) => {
    if (!confirm('Permanently delete this booking? This cannot be undone.')) return
    setUpdating(true)
    try {
      await api.adminDelete(`/bookings/${id}/permanent`)
      toast.success('Booking deleted')
      await fetchBookings()
      if (selected?.id === id) setSelected(null)
    } catch { toast.error('Delete failed') }
    finally { setUpdating(false) }
  }

  // Calendar helpers
  const bookingsByDate = bookings.reduce((acc, b) => {
    if (b.status === 'cancelled') return acc
    acc[b.date] = acc[b.date] || []
    acc[b.date].push(b)
    return acc
  }, {})

  const calDays = () => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }

  const stats = {
    total: bookings.length,
    today: bookings.filter((b) => b.date === today && b.status !== 'cancelled').length,
    pending: bookings.filter((b) => ['pending', 'pending_cash'].includes(b.status)).length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    revenue: bookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + (b.totalAmount || 0), 0),
  }

  const todayBookings = bookings.filter((b) => b.date === today && b.status !== 'cancelled')
    .sort((a, b) => a.timeStart?.localeCompare(b.timeStart))

  const pendingBookings = bookings.filter((b) => ['pending', 'pending_cash'].includes(b.status))

  const scheduleBookingAt = (courtId, hour) => bookings.find((b) =>
    b.courtId === courtId && b.date === scheduleDate && b.status !== 'cancelled' &&
    hour >= parseInt(b.timeStart) && hour < parseInt(b.timeStart) + b.duration
  )

  const filtered = bookings.filter((b) => {
    const okStatus = filterStatus === 'all' || b.status === filterStatus
    const q = search.toLowerCase()
    const okSearch = !q || b.customerName?.toLowerCase().includes(q) || b.referenceNumber?.toLowerCase().includes(q) || b.customerPhone?.includes(q)
    return okStatus && okSearch
  })

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    )},
    { id: 'bookings', label: 'All Bookings', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    )},
    { id: 'pending', label: 'Pending', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), badge: stats.pending },
    { id: 'today', label: "Today's Schedule", icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )},
    { id: 'schedule', label: 'Full Schedule', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m6 10V7M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
      </svg>
    )},
    { id: 'deleted', label: 'Deleted Bookings', icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )},
  ]

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-brand-navy flex flex-col transition-transform duration-300`}
        style={{ background: 'linear-gradient(160deg, #0f1c30 0%, #1B2A4A 100%)' }}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="logo" className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.target.style.display='none' }} />
            <div>
              <p className="text-white font-black text-sm tracking-wide">NET N' PADDLE</p>
              <p className="text-brand-lime text-xs font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                section === item.id
                  ? 'bg-brand-pink text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}>
              <span className="flex items-center gap-3">{item.icon}{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <a href="/" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            View Website
          </a>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="font-black text-brand-navy text-xl">
                {section === 'dashboard' ? 'Overview' : section === 'pending' ? 'Pending Approvals' : section === 'today' ? "Today's Schedule" : section === 'schedule' ? 'Full Schedule' : section === 'deleted' ? 'Deleted Bookings' : 'All Bookings'}
              </h1>
              <p className="text-gray-400 text-xs">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.pending > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                {stats.pending} need review
              </span>
            )}
            <button onClick={fetchBookings} className="p-2 text-gray-400 hover:text-brand-pink hover:bg-pink-50 rounded-xl transition-colors" title="Refresh">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* ── DASHBOARD OVERVIEW ── */}
          {section === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Bookings', value: stats.total, color: 'bg-brand-navy', icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  )},
                  { label: "Today's Sessions", value: stats.today, color: 'bg-brand-pink', icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )},
                  { label: 'Awaiting Review', value: stats.pending, color: 'bg-yellow-500', icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )},
                  { label: 'Total Revenue', value: `₱${stats.revenue.toLocaleString()}`, color: 'bg-brand-lime-dark', icon: (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )},
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center shrink-0`}>{s.icon}</div>
                    <div>
                      <p className="text-2xl font-black text-brand-navy">{s.value}</p>
                      <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent bookings */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-brand-navy">Recent Bookings</h2>
                    <button onClick={() => setSection('bookings')} className="text-brand-pink text-xs font-semibold hover:underline">View all →</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(b)}>
                        <div className="w-9 h-9 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink font-black text-sm shrink-0">
                          {b.customerName?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-navy text-sm truncate">{b.customerName}</p>
                          <p className="text-gray-400 text-xs">{b.courtName?.split('—')[0].trim()} · {b.date ? format(new Date(b.date + 'T00:00:00'), 'MMM d') : ''}</p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="py-10 text-center text-gray-400 text-sm">No bookings yet</div>
                    )}
                  </div>
                </div>

                {/* Pending actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-brand-navy">Needs Your Action</h2>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">{stats.pending}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {pendingBookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="px-6 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-brand-navy text-sm truncate">{b.customerName}</p>
                          <p className="text-gray-400 text-xs">{b.referenceNumber} · ₱{b.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating}
                            className="text-xs bg-green-100 hover:bg-green-500 hover:text-white text-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            Confirm
                          </button>
                          <button onClick={() => setSelected(b)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingBookings.length === 0 && (
                      <div className="py-10 text-center text-gray-400 text-sm">All caught up! No pending bookings.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Calendar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-brand-navy">Booking Calendar</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="font-bold text-brand-navy text-sm w-32 text-center">{format(calMonth, 'MMMM yyyy')}</span>
                    <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                    ))}
                  </div>
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calDays().map((d, i) => {
                      if (!d) return <div key={`e-${i}`} />
                      const dateStr = `${calMonth.getFullYear()}-${String(calMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                      const dayBookings = bookingsByDate[dateStr] || []
                      const isToday = dateStr === today
                      const hasPending = dayBookings.some(b => ['pending','pending_cash'].includes(b.status))
                      const hasConfirmed = dayBookings.some(b => b.status === 'confirmed')
                      return (
                        <button key={d} onClick={() => { setSection('bookings'); setSearch(''); setFilterStatus('all') }}
                          className={`relative flex flex-col items-center py-1.5 rounded-xl transition-all text-xs font-semibold ${
                            isToday ? 'bg-brand-pink text-white' :
                            dayBookings.length > 0 ? 'bg-gray-50 hover:bg-gray-100 text-brand-navy' :
                            'hover:bg-gray-50 text-gray-400'
                          }`}>
                          <span>{d}</span>
                          {dayBookings.length > 0 && (
                            <div className="flex gap-0.5 mt-0.5">
                              {hasConfirmed && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                              {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                              {!hasConfirmed && !hasPending && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                            </div>
                          )}
                          {dayBookings.length > 0 && !isToday && (
                            <span className="text-[10px] text-gray-400 leading-none">{dayBookings.length}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 justify-center flex-wrap">
                    {[
                      { color: 'bg-green-400', label: 'Confirmed' },
                      { color: 'bg-yellow-400', label: 'Pending' },
                      { color: 'bg-blue-400', label: 'Completed' },
                      { color: 'bg-brand-pink', label: 'Today' },
                    ].map(l => (
                      <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ALL BOOKINGS TABLE ── */}
          {section === 'bookings' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm border border-gray-100">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, reference, phone..." className="input-field flex-1 text-sm" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field text-sm sm:w-48">
                  <option value="all">All Status</option>
                  <option value="pending">Pending Payment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-brand-navy">All Bookings <span className="text-gray-400 font-normal text-sm">({filtered.length})</span></h2>
                </div>
                {loading ? (
                  <div className="py-20 text-center text-gray-400">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="py-20 text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    No bookings found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          {['Reference', 'Customer', 'Court', 'Date & Time', 'Amount', 'Proof', 'Status', 'Actions'].map((h) => (
                            <th key={h} className="text-left py-3 px-4 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <button onClick={() => setSelected(b)} className="text-brand-pink font-mono font-semibold hover:underline text-xs">{b.referenceNumber}</button>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-brand-navy">{b.customerName}</p>
                              <p className="text-gray-400 text-xs">{b.customerPhone}</p>
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-medium">{b.courtName?.split('—')[0].trim()}</td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-brand-navy">{b.date ? format(new Date(b.date + 'T00:00:00'), 'MMM d, yyyy') : ''}</p>
                              <p className="text-gray-400 text-xs">{fmtTime(b.timeStart)} – {fmtTime(b.timeEnd)}</p>
                            </td>
                            <td className="py-3 px-4 font-black text-brand-navy">₱{b.totalAmount?.toLocaleString()}</td>
                            <td className="py-3 px-4">
                              {imgUrl(b.screenshotPath) ? (
                                <a href={imgUrl(b.screenshotPath)} target="_blank" rel="noopener noreferrer">
                                  <img src={imgUrl(b.screenshotPath)} alt="proof" className="w-10 h-10 object-cover rounded-lg border border-gray-200 hover:scale-110 transition-transform cursor-zoom-in" />
                                </a>
                              ) : <span className="text-gray-300 text-xs">—</span>}
                            </td>
                            <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1 flex-wrap">
                                {['pending', 'pending_cash'].includes(b.status) && (
                                  <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">Confirm</button>
                                )}
                                {b.status === 'confirmed' && (
                                  <button onClick={() => updateStatus(b.id, 'completed')} disabled={updating}
                                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">Complete</button>
                                )}
                                {!['cancelled', 'completed'].includes(b.status) && (
                                  <button onClick={() => cancelBooking(b.id)} disabled={updating}
                                    className="text-xs bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">Cancel</button>
                                )}
                                <button onClick={() => setSelected(b)}
                                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">View</button>
                                <button onClick={() => openReschedule(b)} disabled={updating}
                                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-2.5 py-1.5 rounded-lg transition-colors">Reschedule</button>
                                <button onClick={() => cancelBooking(b.id)} disabled={updating} title="Move to Deleted Bookings"
                                  className="text-xs bg-red-500 hover:bg-red-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PENDING APPROVALS ── */}
          {section === 'pending' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                <div>
                  <p className="font-bold text-yellow-800 text-sm">Review payment screenshots before confirming</p>
                  <p className="text-yellow-700 text-xs mt-0.5">Check that the amount and account match before you confirm a booking.</p>
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-gray-400">Loading...</div>
              ) : pendingBookings.length === 0 ? (
                <div className="bg-white rounded-2xl py-20 text-center text-gray-400 shadow-sm border border-gray-100">
                  <svg className="w-14 h-14 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="font-semibold">All caught up!</p>
                  <p className="text-sm mt-1">No pending bookings to review.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pendingBookings.map((b) => (
                    <div key={b.id} className="bg-white rounded-2xl shadow-sm border-2 border-yellow-200 overflow-hidden">
                      <div className="bg-yellow-50 px-5 py-3 flex items-center justify-between border-b border-yellow-100">
                        <span className="font-mono text-xs font-bold text-yellow-800">{b.referenceNumber}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink font-black shrink-0">
                            {b.customerName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-brand-navy">{b.customerName}</p>
                            <p className="text-gray-400 text-xs">{b.customerPhone}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Court</span>
                            <span className="font-semibold text-brand-navy">{b.courtName?.split('—')[0].trim()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date</span>
                            <span className="font-semibold text-brand-navy">{b.date ? format(new Date(b.date + 'T00:00:00'), 'MMM d, yyyy') : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Time</span>
                            <span className="font-semibold text-brand-navy">{fmtTime(b.timeStart)} – {fmtTime(b.timeEnd)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-gray-100">
                            <span className="font-bold text-brand-navy">Amount</span>
                            <span className="font-black text-brand-pink text-lg">₱{b.totalAmount?.toLocaleString()}</span>
                          </div>
                        </div>

                        {imgUrl(b.screenshotPath) ? (
                          <a href={imgUrl(b.screenshotPath)} target="_blank" rel="noopener noreferrer">
                            <img src={imgUrl(b.screenshotPath)} alt="Payment proof"
                              className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in mb-4" />
                          </a>
                        ) : (
                          <div className="w-full h-20 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 text-xs mb-4 border border-dashed border-gray-200">
                            No screenshot uploaded
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                            ✓ Confirm
                          </button>
                          <button onClick={() => cancelBooking(b.id)} disabled={updating}
                            className="flex-1 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 font-bold py-2.5 rounded-xl text-sm transition-colors">
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TODAY'S SCHEDULE ── */}
          {section === 'today' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-pink rounded-2xl flex flex-col items-center justify-center text-white shrink-0">
                  <p className="text-xs font-semibold uppercase">{format(new Date(), 'MMM')}</p>
                  <p className="text-2xl font-black leading-none">{format(new Date(), 'd')}</p>
                </div>
                <div>
                  <p className="font-black text-brand-navy text-lg">{format(new Date(), 'EEEE')}</p>
                  <p className="text-gray-400 text-sm">{todayBookings.length} session{todayBookings.length !== 1 ? 's' : ''} scheduled today</p>
                </div>
                <div className="ml-auto flex gap-3 text-center">
                  {[
                    { label: 'Confirmed', val: todayBookings.filter(b => b.status === 'confirmed').length, color: 'text-green-600' },
                    { label: 'Pending', val: todayBookings.filter(b => ['pending','pending_cash'].includes(b.status)).length, color: 'text-yellow-600' },
                    { label: 'Completed', val: todayBookings.filter(b => b.status === 'completed').length, color: 'text-blue-600' },
                  ].map(s => (
                    <div key={s.label} className="hidden sm:block">
                      <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-20 text-center text-gray-400">Loading...</div>
              ) : todayBookings.length === 0 ? (
                <div className="bg-white rounded-2xl py-20 text-center text-gray-400 shadow-sm border border-gray-100">
                  <svg className="w-14 h-14 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="font-semibold">No sessions today</p>
                  <p className="text-sm mt-1">Bookings for today will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayBookings.map((b) => (
                    <div key={b.id} className={`bg-white rounded-2xl shadow-sm border-l-4 overflow-hidden flex ${
                      b.status === 'confirmed' ? 'border-green-400' :
                      b.status === 'completed' ? 'border-blue-400' :
                      b.status === 'cancelled' ? 'border-gray-300' : 'border-yellow-400'
                    }`}>
                      <div className="flex flex-col items-center justify-center px-5 py-4 bg-gray-50 border-r border-gray-100 min-w-[90px] text-center">
                        <p className="text-brand-pink font-black text-base">{fmtTime(b.timeStart)}</p>
                        <p className="text-gray-400 text-xs my-0.5">to</p>
                        <p className="text-brand-navy font-bold text-sm">{fmtTime(b.timeEnd)}</p>
                        <p className="text-gray-400 text-xs mt-1">{b.duration}hr{b.duration > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-brand-navy">{b.customerName}</p>
                            <StatusBadge status={b.status} />
                          </div>
                          <p className="text-gray-500 text-sm">{b.courtName?.split('—')[0].trim()} · {b.customerPhone}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{b.referenceNumber}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-black text-brand-navy text-lg">₱{b.totalAmount?.toLocaleString()}</p>
                          <div className="flex gap-1.5">
                            {['pending', 'pending_cash'].includes(b.status) && (
                              <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating}
                                className="text-xs bg-green-100 hover:bg-green-500 hover:text-white text-green-700 font-bold px-3 py-2 rounded-xl transition-colors">Confirm</button>
                            )}
                            {b.status === 'confirmed' && (
                              <button onClick={() => updateStatus(b.id, 'completed')} disabled={updating}
                                className="text-xs bg-blue-100 hover:bg-blue-500 hover:text-white text-blue-700 font-bold px-3 py-2 rounded-xl transition-colors">Done</button>
                            )}
                            <button onClick={() => setSelected(b)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-3 py-2 rounded-xl transition-colors">View</button>
                            <button onClick={() => cancelBooking(b.id)} disabled={updating} title="Move to Deleted Bookings"
                              className="text-xs bg-red-500 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-xl transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FULL SCHEDULE ── */}
          {section === 'schedule' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 flex-wrap">
                <button onClick={() => setScheduleDate(format(new Date(new Date(scheduleDate + 'T00:00:00').getTime() - 86400000), 'yyyy-MM-dd'))}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-brand-navy" />
                <button onClick={() => setScheduleDate(format(new Date(new Date(scheduleDate + 'T00:00:00').getTime() + 86400000), 'yyyy-MM-dd'))}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button onClick={() => setScheduleDate(today)}
                  className="text-xs font-bold text-brand-pink hover:underline">Today</button>
                <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> Booked</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" /> Available</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="bg-brand-navy text-white text-xs font-bold py-2.5 px-3 text-left sticky left-0">Time</th>
                      {courts.map((c) => (
                        <th key={c.id} className="bg-brand-navy text-white text-xs font-bold py-2.5 px-3 text-center min-w-[140px]">{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 }, (_, i) => SCHEDULE_START_HOUR + i).map((h) => (
                      <tr key={h} className="border-t border-gray-100">
                        <td className="bg-brand-navy/90 text-white text-xs font-semibold py-2.5 px-3 whitespace-nowrap sticky left-0">{timeLabel(h)}</td>
                        {courts.map((c) => {
                          const b = scheduleBookingAt(c.id, h)
                          return (
                            <td key={c.id} className={`text-center text-xs py-2.5 px-3 ${b ? 'bg-red-50' : 'bg-green-50'}`}>
                              {b ? (
                                <button onClick={() => setSelected(b)} className="w-full">
                                  <p className="font-bold text-red-500">Booked</p>
                                  <p className="text-red-400 text-[11px] truncate">{b.customerName}</p>
                                </button>
                              ) : (
                                <span className="font-semibold text-green-600">Available</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DELETED BOOKINGS ── */}
          {section === 'deleted' && (() => {
            const deletedBookings = bookings.filter(b => b.status === 'cancelled')
            return (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <div>
                    <p className="font-bold text-red-800 text-sm">Cancelled bookings</p>
                    <p className="text-red-600 text-xs mt-0.5">These bookings were cancelled. Use the trash button to permanently remove them from the database.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 text-center text-gray-400">Loading...</div>
                ) : deletedBookings.length === 0 ? (
                  <div className="bg-white rounded-2xl py-20 text-center text-gray-400 shadow-sm border border-gray-100">
                    <svg className="w-14 h-14 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <p className="font-semibold">No cancelled bookings</p>
                    <p className="text-sm mt-1">Cancelled bookings will appear here.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h2 className="font-bold text-brand-navy">Cancelled Bookings <span className="text-gray-400 font-normal text-sm">({deletedBookings.length})</span></h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {deletedBookings.map(b => (
                        <div key={b.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-400 font-black text-sm shrink-0">
                            {b.customerName?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-brand-navy">{b.customerName}</p>
                            <p className="text-gray-400 text-xs">{b.referenceNumber} · {b.courtName?.split('—')[0].trim()}</p>
                            <p className="text-gray-400 text-xs">{b.date ? format(new Date(b.date + 'T00:00:00'), 'MMM d, yyyy') : ''} · {fmtTime(b.timeStart)} – {fmtTime(b.timeEnd)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-brand-navy">₱{b.totalAmount?.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{b.customerPhone}</p>
                          </div>
                          <button onClick={() => deleteBooking(b.id)} disabled={updating} title="Delete permanently"
                            className="ml-2 p-2 bg-red-100 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-colors shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

        </main>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setRescheduleModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="hero-gradient p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-1">Rescheduling</p>
                  <p className="text-xl font-black text-white">{rescheduleModal.customerName}</p>
                  <p className="text-brand-lime text-sm font-mono mt-0.5">{rescheduleModal.referenceNumber}</p>
                </div>
                <button onClick={() => setRescheduleModal(null)} className="text-white/60 hover:text-white p-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Court */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Court</label>
                <div className="grid grid-cols-3 gap-2">
                  {courts.map((c) => (
                    <button key={c.id} onClick={() => setRescheduleForm((f) => ({ ...f, courtId: c.id, courtName: c.name, timeStart: '' }))}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${rescheduleForm.courtId === c.id ? 'border-brand-pink bg-brand-pink text-white' : 'border-gray-200 text-gray-600 hover:border-brand-pink'}`}>
                      {c.name?.split('—')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Date</label>
                <input type="date" value={rescheduleForm.date}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setRescheduleForm((f) => ({ ...f, date: e.target.value, timeStart: '' }))}
                  className="input-field w-full" />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duration</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button key={d} onClick={() => setRescheduleForm((f) => ({ ...f, duration: d, timeStart: '' }))}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${rescheduleForm.duration === d ? 'border-brand-pink bg-brand-pink text-white' : 'border-gray-200 text-gray-600 hover:border-brand-pink'}`}>
                      {d}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              {rescheduleForm.courtId && rescheduleForm.date ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Start Time</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => {
                      const avail = slotAvailable(h)
                      const sel = rescheduleForm.timeStart === `${String(h).padStart(2, '0')}:00`
                      return (
                        <button key={h} disabled={!avail}
                          onClick={() => setRescheduleForm((f) => ({ ...f, timeStart: `${String(h).padStart(2, '0')}:00` }))}
                          className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                            sel ? 'border-brand-pink bg-brand-pink text-white' :
                            avail ? 'border-gray-200 text-gray-600 hover:border-brand-pink' :
                            'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}>
                          {timeLabel(h)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm border border-dashed border-gray-200">
                  Select a court and date to see available time slots
                </div>
              )}

              {/* Summary */}
              {rescheduleForm.timeStart && (
                <div className="bg-brand-lime/20 border border-brand-lime rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">New Schedule</p>
                  <p className="font-black text-brand-navy">{rescheduleForm.courtName?.split('—')[0].trim()}</p>
                  <p className="text-brand-navy font-semibold">{rescheduleForm.date ? format(new Date(rescheduleForm.date + 'T00:00:00'), 'MMMM d, yyyy') : ''}</p>
                  <p className="text-gray-600 text-sm">{timeLabel(parseInt(rescheduleForm.timeStart))} – {timeLabel(parseInt(rescheduleForm.timeStart) + rescheduleForm.duration)} · {rescheduleForm.duration}hr{rescheduleForm.duration > 1 ? 's' : ''}</p>
                  <p className="text-brand-pink font-black text-lg mt-1">₱{(rescheduleModal.pricePerHour * rescheduleForm.duration).toLocaleString()}</p>
                </div>
              )}

              <button onClick={submitReschedule} disabled={updating || !rescheduleForm.timeStart}
                className="w-full bg-brand-pink hover:bg-brand-pink/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl text-sm transition-colors">
                {updating ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="hero-gradient p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-1">Booking Reference</p>
                  <p className="text-2xl font-black text-brand-pink">{selected.referenceNumber}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white p-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="mt-3"><StatusBadge status={selected.status} /></div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-3">Customer</h4>
                {[['Name', selected.customerName], ['Phone', selected.customerPhone], ['Email', selected.customerEmail || '—']].map(([l, v]) => (
                  <div key={l} className="flex gap-3 mb-2">
                    <span className="text-gray-400 text-sm w-16 shrink-0">{l}</span>
                    <span className="font-semibold text-brand-navy text-sm">{v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-3">Booking Details</h4>
                {[
                  ['Court', selected.courtName],
                  ['Date', selected.date ? format(new Date(selected.date + 'T00:00:00'), 'MMMM d, yyyy (EEE)') : ''],
                  ['Time', `${fmtTime(selected.timeStart)} – ${fmtTime(selected.timeEnd)}`],
                  ['Duration', `${selected.duration} hour${selected.duration > 1 ? 's' : ''}`],
                  ['Total', `₱${selected.totalAmount?.toLocaleString()}`],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3 mb-2">
                    <span className="text-gray-400 text-sm w-20 shrink-0">{l}</span>
                    <span className="font-semibold text-brand-navy text-sm">{v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-3">Payment</h4>
                {[
                  ['Method', 'GoTyme Bank InstaPay'],
                  ...(selected.gcashReference ? [['Reference', selected.gcashReference]] : []),
                  ['Booked at', selected.createdAt ? format(new Date(selected.createdAt), 'MMM d, yyyy · h:mm a') : ''],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3 mb-2">
                    <span className="text-gray-400 text-sm w-20 shrink-0">{l}</span>
                    <span className="font-semibold text-brand-navy text-sm">{v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-3">Payment Screenshot</h4>
                {imgUrl(selected.screenshotPath) ? (
                  <>
                    <a href={imgUrl(selected.screenshotPath)} target="_blank" rel="noopener noreferrer">
                      <img src={imgUrl(selected.screenshotPath)} alt="Payment proof" className="w-full rounded-2xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </a>
                    <p className="text-xs text-gray-400 mt-2 text-center">Click to open full size</p>
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm border border-dashed border-gray-200">No screenshot uploaded</div>
                )}
              </div>

              {selected.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-400 text-xs uppercase tracking-widest mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 flex flex-wrap gap-2">
                {['pending', 'pending_cash'].includes(selected.status) && (
                  <button onClick={() => updateStatus(selected.id, 'confirmed')} disabled={updating}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">✓ Confirm Booking</button>
                )}
                {selected.status === 'confirmed' && (
                  <button onClick={() => updateStatus(selected.id, 'completed')} disabled={updating}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors">✓ Mark Complete</button>
                )}
                {!['cancelled', 'completed'].includes(selected.status) && (
                  <button onClick={() => cancelBooking(selected.id)} disabled={updating}
                    className="flex-1 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 font-bold py-3 rounded-xl text-sm transition-colors">✕ Cancel</button>
                )}
                <button onClick={() => { setSelected(null); openReschedule(selected) }} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-500 hover:text-white text-blue-600 font-bold py-3 rounded-xl text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Reschedule
                </button>
                <button onClick={() => deleteBooking(selected.id)} disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-red-600 hover:text-white text-gray-500 font-bold py-3 rounded-xl text-sm transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
