import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Button from '../components/Button.jsx'
import Input from '../components/Input.jsx'
import Spinner from '../components/Spinner.jsx'
import { createForm, getForms } from '../lib/api.js'
import { validateTitle } from '../lib/validation.js'

export default function FormList() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [titleError, setTitleError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    status: 'draft',
  })

  const fetchForms = async () => {
    try {
      setLoading(true)
      const data = await getForms()
      setForms(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForms()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setTitleError('')

    // Validate title
    const titleValidation = validateTitle(draft.title)
    if (!titleValidation.valid) {
      setTitleError(titleValidation.error)
      return
    }

    try {
      setCreating(true)
      const created = await createForm({
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        status: draft.status,
      })
      setForms((prev) => [created, ...prev])
      setDraft({ title: '', description: '', status: 'draft' })
      setTitleError('')
      setStatus({ type: 'success', message: 'Form berhasil dibuat.' })
      setShowCreate(false)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setCreating(false)
    }
  }

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

  const labelStatus = (value) => {
    if (!value) return 'Draft'
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  // Filtered and sorted forms
  const filteredForms = forms
    .filter((f) => {
      if (filterStatus !== 'all' && (f.status || 'draft') !== filterStatus) return false
      if (search.trim() && !f.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime()
      const dateB = new Date(b.updatedAt || 0).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Forms</h1>
          <p className="subtext">Kelola seluruh form yang kamu buat</p>
        </div>
        <div className="action-row">
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Tutup' : '+ Form baru'}
          </Button>
        </div>
      </div>

      {showCreate && (
        <div className="form-header-card">
          <div className="form-header-banner" />
          <div className="form-header-body">
            <h3>Buat form baru</h3>
            <form className="stack" onSubmit={handleCreate} style={{ marginTop: '1rem' }}>
              <Input
                label="Title"
                placeholder="Judul form"
                value={draft.title}
                onChange={(event) => {
                  setDraft((prev) => ({ ...prev, title: event.target.value }))
                  if (titleError) setTitleError('')
                }}
                error={titleError}
                disabled={creating}
                required
              />
              <Input
                label="Description"
                placeholder="Deskripsi singkat (opsional)"
                value={draft.description}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                disabled={creating}
              />
              <label className="field">
                <span className="field-label">Status</span>
                <select
                  className="field-input"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, status: event.target.value }))
                  }
                  disabled={creating}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              {status.message ? (
                <p className={`form-status ${status.type}`}>{status.message}</p>
              ) : null}
              <div className="action-row">
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <Spinner size="small" /> Creating...
                    </span>
                  ) : 'Create form'}
                </Button>
                <Button variant="ghost" onClick={() => setShowCreate(false)} disabled={creating}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <Spinner size="large" />
          <span>Loading forms...</span>
        </div>
      ) : null}
      {error ? <p className="form-status error">{error}</p> : null}

      {!loading && forms.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Belum ada form</p>
          <p className="subtext">Klik "+ Form baru" untuk membuat form pertama kamu.</p>
        </div>
      )}

      {/* Filter / Sort bar */}
      {!loading && forms.length > 0 && (
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <select
            className="field-input filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      )}

      {!loading && forms.length > 0 && filteredForms.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <p className="subtext">Tidak ada form yang cocok dengan filter.</p>
        </div>
      )}

      <div className="grid">
        {filteredForms.map((form) => (
          <Link key={form.id} to={`/forms/${form.id}`} className="card form">
            <div className="form-top">
              <span className={`pill pill-${(form.status || 'draft').toLowerCase()}`}>
                {labelStatus(form.status)}
              </span>
              <span className="meta">{formatDate(form.updatedAt)}</span>
            </div>
            <h3>{form.title}</h3>
            <p className="subtext">{form.description || 'Tanpa deskripsi'}</p>
            <div className="form-footer">
              <span>Response: {form.questions?.length || 0}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
