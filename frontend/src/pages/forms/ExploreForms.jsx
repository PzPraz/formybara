import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Spinner from '../../components/ui/Spinner.jsx'
import { getPublicForms } from '../../lib/api.js'

export default function ExploreForms() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const fetchForms = async () => {
    try {
      setLoading(true)
      const data = await getPublicForms({ search: debouncedSearch, sort: sortOrder })
      setForms(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchForms()
  }, [debouncedSearch, sortOrder])

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Jelajahi Form</h1>
          <p className="subtext">Temukan dan isi form yang sedang aktif</p>
        </div>
      </div>

      {/* Search / Sort */}
      <div className="filter-bar">
        <input
          type="text"
          className="field-input filter-search"
          placeholder="Cari judul form..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field-input filter-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      {loading && (
        <div className="loading-container">
          <Spinner size="large" />
          <span>Memuat form...</span>
        </div>
      )}

      {error && <p className="form-status error">{error}</p>}

      {!loading && forms.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Belum ada form aktif</p>
          <p className="subtext">Saat ini tidak ada form yang tersedia untuk diisi.</p>
        </div>
      )}

      <div className="grid explore-grid">
        {forms.map((form) => (
          <Link key={form.id} to={`/respond/${form.id}`} className="card form explore-card">
            <div className="form-top">
              <span className="meta">{formatDate(form.updatedAt)}</span>
            </div>
            <h3>{form.title}</h3>
            <p className="subtext line-clamp">{form.description || 'Tanpa deskripsi'}</p>
            <div className="explore-meta">
              <span className="explore-author">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {form.ownerName}
              </span>
              <span className="explore-stat">{form.questionCount ?? 0} pertanyaan</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
