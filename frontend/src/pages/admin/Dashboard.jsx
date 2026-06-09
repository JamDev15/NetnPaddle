import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { api } from '../../utils/api'

const STATUS = {
  pending:      { label: 'Pending GCash', cls: 'badge-pending' },
  pending_cash: { label: 'Pending Cash',  cls: 'badge-cash' },
  confirmed:    { label: 'Confirmed',     cls: 'badge-confirmed' },
  completed:    { label: 'Completed',     cls: 'badge-completed' },
  cancelled:    { label: 'Cancelled',     cls: 'badge-cancelled' },
}

function fmtTime(t) {
  if (!t) return ''
  const h = parseInt(t)
  const ap = h < 12 ? 'AM' : 'PM'
  const d = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${d}:00 ${ap}`
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

  const today = format(new Date(), 'yyyy-MM-dd')

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
  }, [fetchBookings])

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
    if (!confirm('Cancel this booking?')) return
    setUpdating(true)
    try {
      await api.adminDelete(`/bookings/${id}`)
      toast.success('Booking cancelled')
      await fetchBookings()
      if (selected?.id === id) setSelected(null)
    } catch { toast.error('Cancel failed') }
    finally { setUpdating(false) }
  }

  const stats = {
    total: bookings.length,
    today: bookings.filter((b) => b.date === today && b.status !== 'cancelled').length,
    pending: bookings.filter((b) => ['pending', 'pending_cash'].includes(b.status)).length,
    revenue: bookings.filter((b) => ['confirmed', 'completed'].includes(b.status)).reduce((s, b) => s + (b.totalAmount || 0), 0),
  }

  const filtered = bookings.filter((b) => {
    const okStatus = filterStatus === 'all' || b.status === filterStatus
    const q = search.toLowerCase()
    const okSearch = !q || b.customerName?.toLowerCase().includes(q) || b.referenceNumber?.toLowerCase().includes(q) || b.customerPhone?.includes(q)
    return okStatus && okSearch
  })

  const displayed = section === 'today' ? filtered.filter((b) => b.date === today)
    : section === 'pending' ? filtered.filter((b) => ['pending', 'pending_cash'].includes(b.status))
    : filtered

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'All Bookings', icon: '📋' },
    { id: 'pending', label: 'Pending', icon: '⏳', badge: stats.pending },
    { id: 'today', label: "Today's", icon: '📅' },
  ]

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: '📋', color: 'bg-brand-navy' },
    { label: "Today's Sessions", value: stats.today, icon: '📅', color: 'bg-brand-pink' },
    { label: 'Pending', value: stats.pending, icon: '⏳', color: 'bg-yellow-500' },
    { label: 'Revenue', value: `₱${stats.revenue.toLocaleString()}`, icon: '💰', color: 'bg-brand-lime-dark' },
  ]

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-brand-navy-dark flex flex-col transition-transform duration-300`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-pink flex items-center justify-center text-white font-black text-sm">N²P</div>
            <div>
              <p className="text-white font-bold text-sm">NET N&apos; PADDLE</p>
              <p className="text-brand-lime text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                section === item.id ? 'bg-brand-pink text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}>
              <span className="flex items-center gap-3"><span>{item.icon}</span>{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <a href="/" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm py-2 px-3 rounded-lg hover:bg-white/10 transition-colors mb-2">
            🌐 View Website
          </a>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-400 hover:text-red-300 text-sm py-2 px-3 rounded-lg hover:bg-red-500/10 transition-colors">
            🚪 Log Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-brand-navy text-lg capitalize">
                {section === 'dashboard' ? 'Dashboard Overview' : section === 'pending' ? 'Pending Bookings' : section === 'today' ? "Today's Bookings" : 'All Bookings'}
              </h1>
              <p className="text-gray-400 text-xs">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats.pending > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
                {stats.pending} pending
              </span>
            )}
            <button onClick={fetchBookings} title="Refresh" className="text-gray-400 hover:text-brand-pink transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
                <p className="text-2xl font-black text-brand-navy">{s.value}</p>
                <p className="text-sm text-gray-600 font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3 shadow-sm border border-gray-100">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, reference, phone..." className="input-field flex-1 text-sm" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field text-sm sm:w-48">
              <option value="all">All Status</option>
              <option value="pending">Pending GCash</option>
              <option value="pending_cash">Pending Cash</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-brand-navy">
                Bookings <span className="text-sm text-gray-400 font-normal">({displayed.length})</span>
              </h2>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400">
                <p className="text-4xl mb-4 animate-spin">⚙️</p>
                <p>Loading bookings...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="font-medium">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      {['Reference', 'Customer', 'Court', 'Date & Time', 'Amount', 'Payment', 'Proof', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left py-3 px-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayed.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <button onClick={() => setSelected(b)} className="text-brand-pink font-mono font-semibold hover:underline text-xs">
                            {b.referenceNumber}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-brand-navy">{b.customerName}</p>
                          <p className="text-gray-400 text-xs">{b.customerPhone}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{b.courtName?.split('—')[0].trim()}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-brand-navy">{b.date ? format(new Date(b.date + 'T00:00:00'), 'MMM d') : ''}</p>
                          <p className="text-gray-400 text-xs">{fmtTime(b.timeStart)} – {fmtTime(b.timeEnd)}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-brand-navy">₱{b.totalAmount?.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.paymentMethod === 'gcash' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {b.paymentMethod === 'gcash' ? '💙 GCash' : '💵 Cash'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {b.screenshotPath ? (
                            <a href={b.screenshotPath} target="_blank" rel="noopener noreferrer">
                              <img src={b.screenshotPath} alt="proof"
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200 hover:scale-110 transition-transform cursor-zoom-in" />
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={STATUS[b.status]?.cls || 'badge-pending'}>{STATUS[b.status]?.label || b.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {['pending', 'pending_cash'].includes(b.status) && (
                              <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating}
                                className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-lg transition-colors">Confirm</button>
                            )}
                            {b.status === 'confirmed' && (
                              <button onClick={() => updateStatus(b.id, 'completed')} disabled={updating}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-3 py-1.5 rounded-lg transition-colors">Complete</button>
                            )}
                            {!['cancelled', 'completed'].includes(b.status) && (
                              <button onClick={() => cancelBooking(b.id)} disabled={updating}
                                className="text-xs bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                            )}
                            <button onClick={() => setSelected(b)}
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-3 py-1.5 rounded-lg transition-colors">View</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="hero-gradient p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-xs mb-1">Booking Reference</p>
                  <p className="text-2xl font-black text-brand-pink">{selected.referenceNumber}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3">
                <span className={STATUS[selected.status]?.cls}>{STATUS[selected.status]?.label}</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-3">Customer</h4>
                {[['Name', selected.customerName], ['Phone', selected.customerPhone], ['Email', selected.customerEmail || 'N/A']].map(([l, v]) => (
                  <div key={l} className="flex gap-3 mb-2">
                    <span className="text-gray-400 text-sm w-16 shrink-0">{l}</span>
                    <span className="font-semibold text-brand-navy text-sm">{v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-3">Booking</h4>
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
                <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-3">Payment</h4>
                {[
                  ['Method', selected.paymentMethod === 'gcash' ? 'GCash' : 'Cash'],
                  ...(selected.gcashReference ? [['GCash Ref', selected.gcashReference]] : []),
                  ['Booked', selected.createdAt ? format(new Date(selected.createdAt), 'MMM d, yyyy · h:mm a') : ''],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3 mb-2">
                    <span className="text-gray-400 text-sm w-20 shrink-0">{l}</span>
                    <span className="font-semibold text-brand-navy text-sm font-mono">{v}</span>
                  </div>
                ))}
              </div>

              {/* Payment Screenshot */}
              {selected.screenshotPath && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-3">Payment Screenshot</h4>
                  <a href={selected.screenshotPath} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selected.screenshotPath}
                      alt="Payment proof"
                      className="w-full rounded-2xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </a>
                  <p className="text-xs text-gray-400 mt-2 text-center">Click image to open full size</p>
                </div>
              )}

              {!selected.screenshotPath && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-2">Payment Screenshot</h4>
                  <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-400 text-sm">
                    No screenshot uploaded yet
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selected.notes}</p>
                </div>
              )}

              <div className="border-t pt-4 flex flex-wrap gap-2">
                {['pending', 'pending_cash'].includes(selected.status) && (
                  <button onClick={() => updateStatus(selected.id, 'confirmed')} disabled={updating}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    ✓ Confirm Booking
                  </button>
                )}
                {selected.status === 'confirmed' && (
                  <button onClick={() => updateStatus(selected.id, 'completed')} disabled={updating}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    ✓ Mark Complete
                  </button>
                )}
                {!['cancelled', 'completed'].includes(selected.status) && (
                  <button onClick={() => cancelBooking(selected.id)} disabled={updating}
                    className="flex-1 bg-red-100 hover:bg-red-500 hover:text-white text-red-600 font-semibold py-3 rounded-xl text-sm transition-colors">
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
