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
} from "../lib/api.js";

/* ── Sortable wrapper for each question card ── */
function SortableQuestionCard({ question, saving, onDelete, onEdit, isDraft, children }) {
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
                disabled={saving}
                aria-label="Edit"
              >
                &#9998;
              </button>
              <button
                type="button"
                className="btn-delete-question"
                onClick={() => onDelete(question.id)}
                disabled={saving}
                aria-label="Hapus"
              >
                x
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
    <div
      className="star-rating-preview"
      onMouseLeave={() => setHovered(0)}
    >
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

      {question.type === "star_rating" && (
        <StarRatingPreview />
      )}
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [addType, setAddType] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState(null);
  const [insertMenuIndex, setInsertMenuIndex] = useState(null);
  const [formError, setFormError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", variant: "default", undoData: null });
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

      try {
        const questionsData = await getQuestions(id);
        setQuestions(questionsData || []);
      } catch (err) {
        console.log(err);
        setQuestions([]);
      }
    } catch (err) {
      setError(err.message);
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
      setSnackbar({ open: true, message: "Form berhasil diperbarui.", variant: "success", undoData: null });
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
      navigate("/forms");
    } catch (err) {
      setSnackbar({ open: true, message: err.message, variant: "error", undoData: null });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (questionData) => {
    try {
      setSaving(true);
      const insertAt = insertAfterIndex !== null ? insertAfterIndex + 1 : questions.length;
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
          await reorderQuestions(id, updated.map((q) => q.id));
        } catch (_) { /* best effort */ }
      } else {
        setQuestions((prev) => [...prev, newQuestion]);
      }

      setShowAddQuestion(false);
      setAddType(null);
      setInsertAfterIndex(null);
      setInsertMenuIndex(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, variant: "error", undoData: null });
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
      setQuestions((prev) => [...prev, deletedQuestion].sort((a, b) => a.order - b.order));
      setSnackbar({ open: true, message: err.message, variant: "error", undoData: null });
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
      setQuestions((prev) => [...prev, restored].sort((a, b) => a.order - b.order));
      setSnackbar({ open: false, message: "", variant: "default", undoData: null });
    } catch (err) {
      setSnackbar({ open: true, message: "Gagal membatalkan penghapusan.", variant: "error", undoData: null });
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
        prev.map((q) => (q.id === editingQuestion.id ? updated : q))
      );
      setEditingQuestion(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, variant: "error", undoData: null });
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
      setSnackbar({ open: true, message: "Gagal menyimpan urutan.", variant: "error", undoData: null });
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
        if (!val || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
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

  if (loading) {
    return (
      <section className="page">
        <p className="subtext">Loading form...</p>
      </section>
    );
  }

  if (!form || error) {
    return (
      <section className="page">
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <h3>{error || "Form not found"}</h3>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span>Mode Pratinjau — tampilan ini menunjukkan bagaimana responden melihat formulir Anda</span>
            <button type="button" className="preview-banner-close" onClick={exitPreview}>
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
            <p className="respond-required-note"><span className="required-mark">*</span> Menandakan pertanyaan wajib diisi</p>
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
              <div key={q.id} className={`respond-question-card ${previewFieldErrors[q.id] ? "respond-question-card-error" : ""}`}>
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

                {q.type === "multiple_choice_dropdown" && (
                  <select
                    className="field-input respond-select"
                    value={previewAnswers[q.id] || ""}
                    onChange={(e) => setPreviewAnswer(q.id, e.target.value)}
                  >
                    <option value="">Pilih opsi</option>
                    {(q.options || []).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
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
                  <span className="field-error">{previewFieldErrors[q.id]}</span>
                )}
              </div>
            );
          })}

          {/* Navigation */}
          <div className="respond-nav-buttons">
            {previewPage > 0 && (
              <Button variant="ghost" onClick={() => { setPreviewPage((p) => p - 1); setPreviewFieldErrors({}); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                Sebelumnya
              </Button>
            )}
            <div style={{ flex: 1 }} />
            {previewPage < pvTotal - 1 ? (
              <Button onClick={() => { if (!validatePreviewPage(pvQuestions)) return; setPreviewPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
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
    <section className="page">
      {/* Form Header Card with purple banner */}
      <div className="form-header-card">
        <div className="form-header-banner" />
        <div className="form-header-body">
          {editing ? (
            <form onSubmit={handleSave}>
              <div className="stack">
                <Input
                  placeholder="Judul form"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
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
                <label className="field">
                  <span className="field-label">Status</span>
                  <select
                    className="field-input"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                {formError ? (
                  <p className="form-status error">
                    {formError}
                  </p>
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
            <Button variant="ghost" onClick={enterPreview} disabled={saving || questions.length === 0}>
              Pratinjau
            </Button>
            <Button variant="danger" onClick={() => setDeleteModal(true)} disabled={saving}>
              Hapus
            </Button>
          </div>
          {form.status === "draft" && (
            <div className="add-menu-wrapper">
              <Button onClick={() => setShowAddMenu((v) => !v)} disabled={saving}>
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
                    />
                  ) : (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      saving={saving}
                      onDelete={handleDeleteQuestion}
                      onEdit={handleEditQuestion}
                      isDraft={form.status === "draft"}
                    >
                      <QuestionContent question={question} />
                    </SortableQuestionCard>
                  )}

                  {/* Inline insert: show AddQuestion form after this card */}
                  {showAddQuestion && insertAfterIndex === idx && !editingQuestion && form.status === "draft" && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <AddQuestion
                        onCancel={() => {
                          setShowAddQuestion(false);
                          setAddType(null);
                          setInsertAfterIndex(null);
                        }}
                        onSubmit={handleAddQuestion}
                        initialType={addType === "question" ? "short_answer" : addType}
                      />
                    </div>
                  )}

                  {/* Insert button between cards */}
                  {form.status === "draft" && !editingQuestion && (
                    <div className="insert-between-wrapper">
                      <div className="insert-between-line" />
                      <div className="insert-between-btn-wrapper">
                        <button
                          type="button"
                          className="insert-between-btn"
                          onClick={() => setInsertMenuIndex(insertMenuIndex === idx ? null : idx)}
                          disabled={saving}
                          aria-label="Sisipkan item"
                        >
                          +
                        </button>
                        {insertMenuIndex === idx && (
                          <div className="add-menu-dropdown insert-menu-dropdown">
                            <button type="button" className="add-menu-item" onClick={() => openInsertMenu(idx, "question")}>Pertanyaan</button>
                            <button type="button" className="add-menu-item" onClick={() => openInsertMenu(idx, "text_block")}>Blok Teks</button>
                            <button type="button" className="add-menu-item" onClick={() => openInsertMenu(idx, "page_break")}>Page Break</button>
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
      {showAddQuestion && insertAfterIndex === null && !editingQuestion && form.status === "draft" && (
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
        onClose={() => setSnackbar({ open: false, message: "", variant: "default", undoData: null })}
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
    </section>
  );
}
