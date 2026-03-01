import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Snackbar from '../../components/ui/Snackbar.jsx'
import { createForm, getForms } from '../../lib/api.js'
import { validateTitle } from '../../lib/validation.js'
import Modal from '../../components/ui/Modal.jsx'
import { deleteForm } from '../../lib/api.js'

export default function FormList() {
  const location = useLocation()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [titleError, setTitleError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', variant: 'default' })
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [saving, setSaving] = useState(false); //
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    status: 'draft',
  })

  const fetchForms = async () => {
    try {
      setLoading(true)
      const data = await getForms({ search: debouncedSearch, status: filterStatus, sort: sortOrder })
      setForms(Array.isArray(data) ? data : [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchForms()
  }, [debouncedSearch, filterStatus, sortOrder])

  useEffect(() => {
    if (location.state?.snackbar) {
      setSnackbar({ open: true, ...location.state.snackbar })
      window.history.replaceState({}, '')
    }
  }, [location.state])

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
      setShowCreate(false)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    const id = selectedFormId;
    if (!id) return;

    setDeleteModal(false);
    try {
      setSaving(true);
      
      await deleteForm(id);
    
      setForms((prevForms) => prevForms.filter((form) => form.id !== id));
      setSnackbar({
        open: true,
        message: "Form berhasil dihapus.",
        variant: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
      setSelectedFormId(null);
    }
  };

  const confirmDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFormId(id);
    setDeleteModal(true);
  };

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

  // Forms are already filtered and sorted by the backend
  const filteredForms = forms

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Forms</h1>
          <p className="subtext">Kelola seluruh form yang kamu buat</p>
        </div>
        <div className="action-row">
          <Button variant="canFloat" onClick={() => setShowCreate((v) => !v)}>
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
          <img src="/empty.png" alt="empty" style={{ width: '100%', maxWidth: '500px',}} />
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Belum ada form</p>
          <p className="subtext" style={{marginBottom: '0.75rem'}}>Klik "+ Form baru" untuk membuat form pertama kamu.</p>
          {!showCreate &&
            <Button onClick={() => setShowCreate((v) => !v)}>
            + Buat form pertama
            </Button>
          }
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
            <option value="closed">Closed</option>
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

      {forms.length > 0 && (
        <div className="form-stat">
          <div className="form-stat-box form-total-count"><span className="stat-label">Total forms</span><span className="stat-value">{forms.length}</span></div>
          <div className="form-stat-box form-active-count"><span className="stat-label">Active</span><span className="stat-value">{forms.filter((form) => form.status === "published").length}</span></div>
          <div className="form-stat-box form-draft-count"><span className="stat-label">Draft</span><span className="stat-value">{forms.filter((form) => form.status === "draft").length}</span></div>
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
              <span>Response: {form.responseCount ?? 0}</span>

              <button 
                onClick={(e) => confirmDelete(e, form.id)}
                className="btn-icon-delete"
                title="Hapus Form"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.12817 8.15391C5.12817 10.4103 5.12817 13.5898 5.12817 15.1283C5.23074 16.4616 5.3333 18.2052 5.43587 19.436C5.53843 20.8719 6.7692 22.0001 8.2051 22.0001H15.7948C17.2307 22.0001 18.4615 20.8719 18.5641 19.436C18.6666 18.2052 18.7692 16.4616 18.8718 15.1283C18.9743 13.5898 18.8718 10.4103 18.8718 8.15391H5.12817Z"
                    fill="#030D45"
                  />
                  <path
                    d="M19.1795 5.07698H16.6154L15.7949 3.53852C15.2821 2.61545 14.359 2.00006 13.3333 2.00006H10.8718C9.84615 2.00006 8.82051 2.61545 8.41026 3.53852L7.38462 5.07698H4.82051C4.41026 5.07698 4 5.48724 4 5.8975C4 6.30775 4.41026 6.71801 4.82051 6.71801H19.1795C19.5897 6.71801 20 6.41032 20 5.8975C20 5.38468 19.5897 5.07698 19.1795 5.07698ZM9.12821 5.07698L9.64103 4.25647C9.84615 3.84621 10.2564 3.53852 10.7692 3.53852H13.2308C13.7436 3.53852 14.1538 3.74365 14.359 4.25647L14.8718 5.07698H9.12821Z"
                    fill="#030D45"
                  />
                </svg>
              </button>
            </div>
          </Link>
        ))}
      </div>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

    <Modal
      open={deleteModal}
      title="Hapus Form"
      message="Apakah Anda yakin ingin menghapus form ini? Tindakan ini tidak dapat dibatalkan."
      confirmLabel="Hapus"
      cancelLabel="Batal"
      variant="danger"
      onConfirm={handleDelete}
      onCancel={() => setDeleteModal(false)}
    />
    </section>
  )
}
