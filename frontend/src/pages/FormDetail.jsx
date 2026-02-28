import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import AddQuestion from "../components/AddQuestion.jsx";
import Snackbar from "../components/Snackbar.jsx";
import Modal from "../components/Modal.jsx";
import {
  deleteForm,
  getFormById,
  updateForm,
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  ApiError,
} from "../lib/api.js";

/* ── Sortable wrapper for each question card ── */
function SortableQuestionCard({
  question,
  saving,
  onDelete,
  onEdit,
  isDraft,
  hasResponses,
  children,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPageBreak = question.type === "page_break";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        isPageBreak ? "page-break-card" : "question-card question-card-accent"
      }
    >
      <div className={isPageBreak ? "page-break-body" : "question-card-body"}>
        <div className="question-header">
          <div
            className="question-info"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            {isDraft && (
              <button
                type="button"
                className="drag-handle"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
                disabled={hasResponses}
                style={hasResponses ? { opacity: 0.4, cursor: "not-allowed" } : {}}
              >
                &#x2630;
              </button>
            )}
            <div style={{ flex: 1 }}>{children}</div>
          </div>
          {isDraft && (
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <button
                type="button"
                className="btn-edit-question"
                onClick={() => onEdit(question)}
                disabled={saving || hasResponses}
                aria-label="Edit"
                title={hasResponses ? "Tidak dapat mengedit pertanyaan karena form sudah memiliki respons" : "Edit"}
              >
                &#9998;
              </button>
              <button
                type="button"
                className="btn-delete-question"
                onClick={() => onDelete(question.id)}
                disabled={saving || hasResponses}
                aria-label="Hapus"
                title={hasResponses ? "Tidak dapat menghapus pertanyaan karena form sudah memiliki respons" : "Hapus"}
              >
              <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.12817 8.15391C5.12817 10.4103 5.12817 13.5898 5.12817 15.1283C5.23074 16.4616 5.3333 18.2052 5.43587 19.436C5.53843 20.8719 6.7692 22.0001 8.2051 22.0001H15.7948C17.2307 22.0001 18.4615 20.8719 18.5641 19.436C18.6666 18.2052 18.7692 16.4616 18.8718 15.1283C18.9743 13.5898 18.8718 10.4103 18.8718 8.15391H5.12817Z" fill="#030D45"/>
              <path d="M19.1795 5.07698H16.6154L15.7949 3.53852C15.2821 2.61545 14.359 2.00006 13.3333 2.00006H10.8718C9.84615 2.00006 8.82051 2.61545 8.41026 3.53852L7.38462 5.07698H4.82051C4.41026 5.07698 4 5.48724 4 5.8975C4 6.30775 4.41026 6.71801 4.82051 6.71801H19.1795C19.5897 6.71801 20 6.41032 20 5.8975C20 5.38468 19.5897 5.07698 19.1795 5.07698ZM9.12821 5.07698L9.64103 4.25647C9.84615 3.84621 10.2564 3.53852 10.7692 3.53852H13.2308C13.7436 3.53852 14.1538 3.74365 14.359 4.25647L14.8718 5.07698H9.12821Z" fill="#030D45"/>
              </svg>
              
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Star rating interactive preview ── */
function StarRatingPreview() {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-rating-preview" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="star-item">
          <span className="star-number">{n}</span>
          <span
            className={`star-icon ${
              n <= (hovered || selected) ? "star-filled" : "star-empty"
            }`}
            onClick={() => setSelected(n === selected ? 0 : n)}
            onMouseEnter={() => setHovered(n)}
          >
            &#9733;
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Interactive inputs for preview mode ── */
function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating-preview" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="star-item">
          <span className="star-number">{n}</span>
          <span
            className={`star-icon ${n <= (hovered || value) ? "star-filled" : "star-empty"}`}
            onClick={() => onChange(n === value ? 0 : n)}
            onMouseEnter={() => setHovered(n)}
            style={{ cursor: "pointer" }}
          >
            &#9733;
          </span>
        </div>
      ))}
    </div>
  );
}

function LinearScaleInput({ value, onChange, labelMin, labelMax }) {
  return (
    <div className="linear-scale-preview">
      <div className="rating-preview">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`rating-circle ${value === String(n) ? "rating-circle-selected" : ""}`}
            onClick={() => onChange(String(n))}
            style={{ cursor: "pointer" }}
          >
            {n}
          </div>
        ))}
      </div>
      {(labelMin || labelMax) && (
        <div className="scale-labels-row">
          <span className="scale-label">{labelMin || ""}</span>
          <span className="scale-label">{labelMax || ""}</span>
        </div>
      )}
    </div>
  );
}

function QuestionContent({ question }) {
  if (question.type === "page_break") {
    return (
      <div className="page-break-content">
        <span className="page-break-line" />
        <span className="page-break-label">
          {question.title || "Page Break"}
        </span>
        <span className="page-break-line" />
      </div>
    );
  }

  if (question.type === "text_block") {
    return (
      <div className="text-block-content">
        <p className="text-block-text">{question.title}</p>
      </div>
    );
  }

  return (
    <>
      <p className="question-title">
        {question.title}
        {question.required && <span className="required-mark">*</span>}
      </p>

      {question.type === "short_answer" && (
        <div className="answer-placeholder">Jawaban singkat</div>
      )}

      {question.type === "long_answer" && (
        <textarea
          className="field-input field-textarea"
          placeholder="Jawaban panjang responden..."
          rows={4}
          disabled
          style={{
            backgroundColor: "#f9f1ec",
            cursor: "not-allowed",
            marginTop: "0.75rem",
          }}
        />
      )}

      {question.type === "multiple_choice" && question.options?.length > 0 && (
        <div className="question-options">
          {question.options.map((option, i) => (
            <p key={i} className="option-preview">
              {option}
            </p>
          ))}
        </div>
      )}

      {question.type === "multiple_choice_dropdown" &&
        question.options?.length > 0 && (
          <div className="question-options">
            <select className="dropdown-preview" disabled>
              <option value="">Pilih opsi</option>
              {question.options.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

      {question.type === "date_picker" && (
        <div className="question-options">
          <div className="date-input-wrapper">
            <input 
              type="date"
              className="field-input date-preview"
              style={{
                backgroundColor: "#f9fafb",
                color: "#6b7280"
              }}
            />
          </div>
        </div>
      )}

      {question.type === "linear_scale" && (
        <div className="linear-scale-preview">
          <div className="rating-preview">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="rating-circle">
                {n}
              </div>
            ))}
          </div>
          {(question.labelMin || question.labelMax) && (
            <div className="scale-labels-row">
              <span className="scale-label">{question.labelMin || ""}</span>
              <span className="scale-label">{question.labelMax || ""}</span>
            </div>
          )}
        </div>
      )}

      {question.type === "star_rating" && <StarRatingPreview />}
    </>
  );
}

/* ── Main component ── */
export default function FormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(null); // 'not-found' | 'forbidden' | 'generic'
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [addType, setAddType] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState(null);
  const [formError, setFormError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    variant: "default",
    undoData: null,
  });
  const [deleteModal, setDeleteModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewPage, setPreviewPage] = useState(0);
  const [previewFieldErrors, setPreviewFieldErrors] = useState({});
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    status: "draft",
  });

  const isDraft = form?.status === "draft";
  const hasResponses = form?.responseCount > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchForm = async () => {
    try {
      setLoading(true);
      const data = await getFormById(id);
      setForm(data);
      setDraft({
        title: data.title || "",
        description: data.description || "",
        status: data.status || "draft",
      });
      setError("");
      setErrorType(null);

      try {
        const questionsData = await getQuestions(id);
        setQuestions(questionsData || []);
      } catch (err) {
        console.log(err);
        setQuestions([]);
      }
    } catch (err) {
      setError(err.message);
      if (err instanceof ApiError) {
        if (err.status === 404) setErrorType('not-found');
        else if (err.status === 403) setErrorType('forbidden');
        else setErrorType('generic');
      } else {
        setErrorType('generic');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForm();
  }, [id]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const labelStatus = (value) => {
    if (!value) return "Draft";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!draft.title.trim()) {
      setFormError("Title wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateForm(id, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        status: draft.status,
      });
      setForm(updated);
      setEditing(false);
      setSnackbar({
        open: true,
        message: "Form berhasil diperbarui.",
        variant: "success",
        undoData: null,
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteModal(false);
    try {
      setSaving(true);
      await deleteForm(id);
      navigate("/forms", { state: { snackbar: { message: "Form berhasil dihapus.", variant: "success" } } });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        variant: "error",
        undoData: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (questionData) => {
    try {
      setSaving(true);
      const insertAt =
        insertAfterIndex !== null ? insertAfterIndex + 1 : questions.length;
      const newQuestion = await createQuestion(id, {
        ...questionData,
        order: insertAt,
      });

      // If inserting in the middle, update order of subsequent questions
      if (insertAt < questions.length) {
        const updated = [
          ...questions.slice(0, insertAt),
          newQuestion,
          ...questions.slice(insertAt),
        ];
        setQuestions(updated);
        // Reorder on server
        try {
          await reorderQuestions(
            id,
            updated.map((q) => q.id),
          );
        } catch (_) {
        }
      } else {
        setQuestions((prev) => [...prev, newQuestion]);
      }

      setShowAddQuestion(false);
      setAddType(null);
      setInsertAfterIndex(null);
      setInsertMenuIndex(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        variant: "error",
        undoData: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const deletedQuestion = questions.find((q) => q.id === questionId);
    if (!deletedQuestion) return;

    // Optimistically remove from UI
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));

    // Delete on server
    try {
      setSaving(true);
      await deleteQuestion(id, questionId);
      setSnackbar({
        open: true,
        message: "Item berhasil dihapus.",
        variant: "default",
        undoData: deletedQuestion,
      });
    } catch (err) {
      // Restore on failure
      setQuestions((prev) =>
        [...prev, deletedQuestion].sort((a, b) => a.order - b.order),
      );
      setSnackbar({
        open: true,
        message: err.message,
        variant: "error",
        undoData: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUndoDelete = async () => {
    const q = snackbar.undoData;
    if (!q) return;
    try {
      setSaving(true);
      const restored = await createQuestion(id, {
        type: q.type,
        title: q.title,
        required: q.required,
        order: q.order,
        options: q.options || [],
        allowMultiple: q.allowMultiple || false,
        labelMin: q.labelMin || undefined,
        labelMax: q.labelMax || undefined,
      });
      setQuestions((prev) =>
        [...prev, restored].sort((a, b) => a.order - b.order),
      );
      setSnackbar({
        open: false,
        message: "",
        variant: "default",
        undoData: null,
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Gagal membatalkan penghapusan.",
        variant: "error",
        undoData: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowAddQuestion(false);
    setAddType(null);
  };

  const handleUpdateQuestion = async (questionData) => {
    if (!editingQuestion) return;
    try {
      setSaving(true);
      const updated = await updateQuestion(id, editingQuestion.id, {
        ...questionData,
        order: editingQuestion.order,
      });
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingQuestion.id ? updated : q)),
      );
      setEditingQuestion(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message,
        variant: "error",
        undoData: null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reordered);

    try {
      await reorderQuestions(
        id,
        reordered.map((q) => q.id),
      );
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Gagal menyimpan urutan.",
        variant: "error",
        undoData: null,
      });
      console.log(err);
      setQuestions(questions);
    }
  };

  const openAddMenu = (type) => {
    setShowAddMenu(false);
    setInsertMenuIndex(null);
    setAddType(type);
    setShowAddQuestion(true);
    setInsertAfterIndex(null);
  };

  const openInsertMenu = (index, type) => {
    setInsertMenuIndex(null);
    setAddType(type);
    setShowAddQuestion(true);
    setInsertAfterIndex(index);
    setEditingQuestion(null);
  };

  /* ── Preview mode helpers ── */
  const getPreviewPages = () => {
    const pages = [[]];
    for (const q of questions) {
      if (q.type === "page_break") {
        pages.push([]);
      } else {
        pages[pages.length - 1].push(q);
      }
    }
    return pages;
  };

  const setPreviewAnswer = (qId, val) => {
    setPreviewAnswers((prev) => ({ ...prev, [qId]: val }));
    setPreviewFieldErrors((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const togglePreviewMulti = (qId, option) => {
    setPreviewAnswers((prev) => {
      const current = prev[qId] || [];
      if (current.includes(option)) {
        return { ...prev, [qId]: current.filter((v) => v !== option) };
      }
      return { ...prev, [qId]: [...current, option] };
    });
    setPreviewFieldErrors((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const validatePreviewPage = (pvQuestions) => {
    const errors = {};
    for (const q of pvQuestions) {
      if (q.type === "text_block") continue;
      if (q.required) {
        const val = previewAnswers[q.id];
        if (
          !val ||
          (typeof val === "string" && !val.trim()) ||
          (Array.isArray(val) && val.length === 0)
        ) {
          errors[q.id] = "Pertanyaan ini wajib dijawab.";
        }
      }
    }
    setPreviewFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const enterPreview = () => {
    setPreviewMode(true);
    setPreviewAnswers({});
    setPreviewPage(0);
    setPreviewFieldErrors({});
  };

  const exitPreview = () => {
    setPreviewMode(false);
    setPreviewAnswers({});
    setPreviewPage(0);
    setPreviewFieldErrors({});
  };

  /* ── Status change helpers ── */
  const handleStatusChange = async (newStatus) => {
    try {
      setSaving(true);
      const updated = await updateForm(id, { status: newStatus });
      setForm(updated);
      setDraft((prev) => ({ ...prev, status: newStatus }));
      setSnackbar({
        open: true,
        message: newStatus === "published" ? "Form berhasil dipublikasi." : newStatus === "closed" ? "Form berhasil ditutup." : "Form dikembalikan ke draft.",
        variant: "success",
        undoData: null,
      });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, variant: "error", undoData: null });
    } finally {
      setSaving(false);
    }
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const respondentLink = `${window.location.origin}/respond/${id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(respondentLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <section className="page">
        <p className="subtext">Loading form...</p>
      </section>
    );
  }

  if (!form || error) {
    const errorConfig = {
      'not-found': {
        img: '/not-found.png',
        alt: 'Not found',
        title: 'Form tidak ditemukan',
        subtitle: 'Form yang Anda cari tidak ada atau sudah dihapus.',
      },
      'forbidden': {
        img: '/permission-denied.png',
        alt: 'Forbidden',
        title: 'Akses ditolak',
        subtitle: 'Anda tidak memiliki akses untuk melihat form ini.',
      },
      'generic': {
        img: '/404.png',
        alt: 'Error',
        title: 'Terjadi kesalahan',
        subtitle: error || 'Mohon coba lagi nanti.',
      },
    };
    const cfg = errorConfig[errorType] || errorConfig['not-found'];

    return (
      <section className="page">
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <img src={cfg.img} alt={cfg.alt} style={{ maxWidth: '280px', marginBottom: '1rem' }} />
          <h3>{cfg.title}</h3>
          <p className="subtext" style={{ marginTop: '0.5rem' }}>{cfg.subtitle}</p>
          <Link
            to="/forms"
            className="link"
            style={{ marginTop: "1rem", display: "inline-block" }}
          >
            &larr; Kembali ke daftar form
          </Link>
        </div>
      </section>
    );
  }

  /* ── Preview mode render ── */
  if (previewMode) {
    const pvPages = getPreviewPages();
    const pvTotal = pvPages.length;
    const pvQuestions = pvPages[previewPage] || [];

    return (
      <section className="page">
        {/* Preview banner */}
        <div className="preview-banner">
          <div className="preview-banner-inner">
            <span className="preview-banner-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span>
              Mode Pratinjau — tampilan ini menunjukkan bagaimana responden
              melihat formulir Anda
            </span>
            <button
              type="button"
              className="preview-banner-close"
              onClick={exitPreview}
            >
              Keluar Pratinjau
            </button>
          </div>
        </div>

        <div className="respond-container">
          {/* Header */}
          <div className="respond-header-card">
            <h1 className="respond-title">{form.title}</h1>
            {form.description && (
              <p className="respond-description">{form.description}</p>
            )}
            {pvTotal > 1 && (
              <div className="respond-progress">
                <div className="respond-progress-bar">
                  <div
                    className="respond-progress-fill"
                    style={{ width: `${((previewPage + 1) / pvTotal) * 100}%` }}
                  />
                </div>
                <span className="respond-progress-text">
                  Halaman {previewPage + 1} dari {pvTotal}
                </span>
              </div>
            )}
            <p className="respond-required-note">
              <span className="required-mark">*</span> Menandakan pertanyaan
              wajib diisi
            </p>
          </div>

          {/* Questions */}
          {pvQuestions.map((q) => {
            if (q.type === "text_block") {
              return (
                <div key={q.id} className="respond-text-block-card">
                  <p className="text-block-text">{q.title}</p>
                </div>
              );
            }

            return (
              <div
                key={q.id}
                className={`respond-question-card ${previewFieldErrors[q.id] ? "respond-question-card-error" : ""}`}
              >
                <p className="respond-question-title">
                  {q.title}
                  {q.required && <span className="required-mark">*</span>}
                </p>

                {q.type === "short_answer" && (
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Jawaban Anda"
                    value={previewAnswers[q.id] || ""}
                    onChange={(e) => setPreviewAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === "long_answer" && (
                  <textarea
                    className="field-input field-textarea"
                    placeholder="Jawaban Anda"
                    rows={4}
                    value={previewAnswers[q.id] || ""}
                    onChange={(e) => setPreviewAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === "multiple_choice" && !q.allowMultiple && (
                  <div className="respond-options">
                    {(q.options || []).map((opt, i) => (
                      <label key={i} className="respond-radio-option">
                        <input
                          type="radio"
                          name={`pv-${q.id}`}
                          checked={previewAnswers[q.id] === opt}
                          onChange={() => setPreviewAnswer(q.id, opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "multiple_choice" && q.allowMultiple && (
                  <div className="respond-options">
                    {(q.options || []).map((opt, i) => (
                      <label key={i} className="respond-checkbox-option">
                        <input
                          type="checkbox"
                          checked={(previewAnswers[q.id] || []).includes(opt)}
                          onChange={() => togglePreviewMulti(q.id, opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "date_picker" && (
                  <div className="question-options">
                    <div className="date-input-wrapper">
                      <input 
                        type="date"
                        className="field-input date-preview"
                        style={{
                          backgroundColor: "#f9fafb",
                          color: "#6b7280"
                        }}
                      />
                    </div>
                  </div>
                )}

                {q.type === "multiple_choice_dropdown" && (
                  <select
                    className="field-input respond-select"
                    value={previewAnswers[q.id] || ""}
                    onChange={(e) => setPreviewAnswer(q.id, e.target.value)}
                  >
                    <option value="">Pilih opsi</option>
                    {(q.options || []).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {q.type === "linear_scale" && (
                  <LinearScaleInput
                    value={previewAnswers[q.id] || ""}
                    onChange={(val) => setPreviewAnswer(q.id, val)}
                    labelMin={q.labelMin}
                    labelMax={q.labelMax}
                  />
                )}

                {q.type === "star_rating" && (
                  <StarRatingInput
                    value={Number(previewAnswers[q.id]) || 0}
                    onChange={(val) => setPreviewAnswer(q.id, String(val))}
                  />
                )}

                {previewFieldErrors[q.id] && (
                  <span className="field-error">
                    {previewFieldErrors[q.id]}
                  </span>
                )}
              </div>
            );
          })}

          {/* Navigation */}
          <div className="respond-nav-buttons">
            {previewPage > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setPreviewPage((p) => p - 1);
                  setPreviewFieldErrors({});
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Sebelumnya
              </Button>
            )}
            <div style={{ flex: 1 }} />
            {previewPage < pvTotal - 1 ? (
              <Button
                onClick={() => {
                  if (!validatePreviewPage(pvQuestions)) return;
                  setPreviewPage((p) => p + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Selanjutnya
              </Button>
            ) : (
              <Button disabled>Kirim</Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page form-detail-layout">
      {/* ── Main content ── */}
      <div className="form-detail-main">
      {/* Form Header Card with purple banner */}
      <div className="form-header-card">
        <div className="form-header-banner" />
        <div className="form-header-body">
          {editing ? (
            <form onSubmit={handleSave}>
              <div className="stack">
                <label className="field">
                  <span className="field-label">Title</span>
                  <Input
                    placeholder="Judul form"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span className="field-label">Description</span>
                  <Input
                    placeholder="Deskripsi form (opsional)"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </label>
                {formError ? (
                  <p className="form-status error">{formError}</p>
                ) : null}
                <div className="action-row">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Simpan"}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <h1>{form.title}</h1>
              <p className="form-desc">
                {form.description || "Tanpa deskripsi"}
              </p>
              <div className="detail-meta" style={{ marginTop: "0.75rem" }}>
                <span
                  className={`pill pill-${(form.status || "draft").toLowerCase()}`}
                >
                  {labelStatus(form.status)}
                </span>
                <span className="meta">
                  Diperbarui {formatDate(form.updatedAt)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action bar */}
      {!editing && (
        <div
          className="card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="action-row">
            {form.status === "draft" && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Edit form
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={enterPreview}
              disabled={saving || questions.length === 0}
            >
              Pratinjau
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteModal(true)}
              disabled={saving}
            >
              Hapus
            </Button>
          </div>
          {form.status === "draft" && !showAddQuestion && !hasResponses && (
            <div className="add-menu-wrapper">
              <Button
                onClick={() => setShowAddMenu((v) => !v)}
                disabled={saving}
              >
                + Tambah Item
              </Button>
              {showAddMenu && (
                <div className="add-menu-dropdown">
                  <button
                    type="button"
                    className="add-menu-item"
                    onClick={() => openAddMenu("question")}
                  >
                    Pertanyaan
                  </button>
                  <button
                    type="button"
                    className="add-menu-item"
                    onClick={() => openAddMenu("text_block")}
                  >
                    Blok Teks
                  </button>
                  <button
                    type="button"
                    className="add-menu-item"
                    onClick={() => openAddMenu("page_break")}
                  >
                    Page Break
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Questions list with drag-and-drop */}
      {questions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="question-list">
              {questions.map((question, idx) => (
                <div key={question.id}>
                  {editingQuestion && editingQuestion.id === question.id ? (
                    <AddQuestion
                      onCancel={() => setEditingQuestion(null)}
                      onSubmit={handleUpdateQuestion}
                      initialData={editingQuestion}
                      submitLabel="Simpan Perubahan"
                      disableTypeChange={hasResponses}
                    />
                  ) : (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      saving={saving}
                      onDelete={handleDeleteQuestion}
                      onEdit={handleEditQuestion}
                      isDraft={form.status === "draft"}
                      hasResponses={hasResponses}
                    >
                      <QuestionContent question={question} />
                    </SortableQuestionCard>
                  )}

                  {/* Inline insert: show AddQuestion form after this card */}
                  {showAddQuestion &&
                    insertAfterIndex === idx &&
                    !editingQuestion &&
                    form.status === "draft" && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <AddQuestion
                          onCancel={() => {
                            setShowAddQuestion(false);
                            setAddType(null);
                            setInsertAfterIndex(null);
                          }}
                          onSubmit={handleAddQuestion}
                          initialType={
                            addType === "question" ? "short_answer" : addType
                          }
                        />
                      </div>
                    )}

                  {/* Insert button between cards */}
                  {form.status === "draft" && !editingQuestion && !hasResponses && (
                    <div className="insert-between-wrapper">
                      <div className="insert-between-line" />
                      <div className="insert-between-btn-wrapper">
                        <button
                          type="button"
                          className="insert-between-btn"
                          onClick={() =>
                            setInsertMenuIndex(
                              insertMenuIndex === idx ? null : idx,
                            )
                          }
                          disabled={saving}
                          aria-label="Sisipkan item"
                        >
                          +
                        </button>
                        {insertMenuIndex === idx && (
                          <div className="add-menu-dropdown insert-menu-dropdown">
                            <button
                              type="button"
                              className="add-menu-item"
                              onClick={() => openInsertMenu(idx, "question")}
                            >
                              Pertanyaan
                            </button>
                            <button
                              type="button"
                              className="add-menu-item"
                              onClick={() => openInsertMenu(idx, "text_block")}
                            >
                              Blok Teks
                            </button>
                            <button
                              type="button"
                              className="add-menu-item"
                              onClick={() => openInsertMenu(idx, "page_break")}
                            >
                              Page Break
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="insert-between-line" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : !showAddQuestion ? (
        <div
          className="card"
          style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}
        >
          <p style={{ marginBottom: "0.5rem" }}>Belum ada pertanyaan</p>
          <p className="subtext">
            Klik "+ Tambah Item" untuk menambahkan pertanyaan ke form ini.
          </p>
        </div>
      ) : null}

      {/* Inline add question form (only at bottom when not inserting between) */}
      {showAddQuestion &&
        insertAfterIndex === null &&
        !editingQuestion &&
        form.status === "draft" && (
          <AddQuestion
            onCancel={() => {
              setShowAddQuestion(false);
              setAddType(null);
            }}
            onSubmit={handleAddQuestion}
            initialType={addType === "question" ? "short_answer" : addType}
          />
        )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        variant={snackbar.variant}
        actionLabel={snackbar.undoData ? "Undo" : undefined}
        onAction={handleUndoDelete}
        onClose={() =>
          setSnackbar({
            open: false,
            message: "",
            variant: "default",
            undoData: null,
          })
        }
        duration={5000}
      />

      {/* Modal for delete form confirmation */}
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
      </div>

      {/* ── Sidebar ── */}
      <aside className="form-detail-sidebar">
        <div className="sidebar-card">
          <h4 className="sidebar-card-title">Status</h4>
          <span className={`pill pill-${(form.status || "draft").toLowerCase()}`}>
            {labelStatus(form.status)}
          </span>

          <div className="sidebar-actions">
            {form.status === "draft" && (
              <button
                type="button"
                className="sidebar-btn sidebar-btn-publish"
                onClick={() => handleStatusChange("published")}
                disabled={saving || questions.length === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                Publikasi
              </button>
            )}
            {form.status === "closed" && !hasResponses && (
              <button
                  type="button"
                  className="sidebar-btn sidebar-btn-draft"
                  onClick={() => handleStatusChange("draft")}
                  disabled={saving}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Kembali ke Draft
                </button>
            )}
            {form.status === "published" && (
              <button
                type="button"
                className="sidebar-btn sidebar-btn-closed"
                onClick={() => handleStatusChange("closed")}
                disabled={saving}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Tutup Form
              </button>
            )}
            {form.status === "closed" && (
              <button
                type="button"
                className="sidebar-btn sidebar-btn-publish"
                onClick={() => handleStatusChange("published")}
                disabled={saving}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                Buka Kembali
              </button>
            )}
          </div>
        </div>

        {(form.status === "published") && (
          <div className="sidebar-card">
            <h4 className="sidebar-card-title">Bagikan</h4>
            <p className="sidebar-share-desc">Kirim link ini kepada responden untuk mengisi formulir.</p>
            <div className="sidebar-link-box">
              <input
                type="text"
                className="sidebar-link-input"
                value={respondentLink}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                className="sidebar-copy-btn"
                onClick={handleCopyLink}
              >
                {linkCopied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="sidebar-card">
          <h4 className="sidebar-card-title">Info</h4>
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Response</span>
            <span>{form.responseCount ?? 0}</span>
          </div>
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Diperbarui</span>
            <span>{formatDate(form.updatedAt)}</span>
          </div>
          <div className="sidebar-info-row">
            <span className="sidebar-info-label">Dibuat</span>
            <span>{formatDate(form.createdAt)}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}
