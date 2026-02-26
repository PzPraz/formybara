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
  const [status, setStatus] = useState({ type: "", message: "" });
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
    setStatus({ type: "", message: "" });

    if (!draft.title.trim()) {
      setStatus({ type: "error", message: "Title wajib diisi." });
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
      setStatus({ type: "success", message: "Form berhasil diperbarui." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Hapus form ini?");
    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteForm(id);
      navigate("/forms");
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (questionData) => {
    try {
      setSaving(true);
      const newQuestion = await createQuestion(id, {
        ...questionData,
        order: questions.length,
      });
      setQuestions((prev) => [...prev, newQuestion]);
      setShowAddQuestion(false);
      setAddType(null);
      const label =
        questionData.type === "page_break"
          ? "Page break"
          : questionData.type === "text_block"
            ? "Blok teks"
            : "Pertanyaan";
      setStatus({ type: "success", message: `${label} berhasil ditambahkan.` });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const confirmed = window.confirm("Hapus item ini?");
    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteQuestion(id, questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setStatus({ type: "success", message: "Item berhasil dihapus." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
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
      setStatus({ type: "success", message: "Pertanyaan berhasil diperbarui." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
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
      setStatus({ type: "error", message: "Gagal menyimpan urutan." });
      console.log(err);
      setQuestions(questions);
    }
  };

  const openAddMenu = (type) => {
    setShowAddMenu(false);
    setAddType(type);
    setShowAddQuestion(true);
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

  return (
    <section className="page">
      {/* Back link */}
      <Link to="/forms" className="link">
        &larr; Kembali
      </Link>

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
                {status.message ? (
                  <p className={`form-status ${status.type}`}>
                    {status.message}
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
            <Button variant="danger" onClick={handleDelete} disabled={saving}>
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
              {questions.map((question) => (
                editingQuestion && editingQuestion.id === question.id ? (
                  <div key={question.id} className="question-card question-card-accent">
                    <div className="question-card-body">
                      <AddQuestion
                        onCancel={() => setEditingQuestion(null)}
                        onSubmit={handleUpdateQuestion}
                        initialData={editingQuestion}
                        submitLabel="Simpan Perubahan"
                      />
                    </div>
                  </div>
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
                )
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

      {/* Inline add question form */}
      {showAddQuestion && !editingQuestion && form.status === "draft" && (
        <AddQuestion
          onCancel={() => {
            setShowAddQuestion(false);
            setAddType(null);
          }}
          onSubmit={handleAddQuestion}
          initialType={addType === "question" ? "short_answer" : addType}
        />
      )}

      {/* Status message */}
      {status.message && !editing ? (
        <p className={`form-status ${status.type}`}>{status.message}</p>
      ) : null}
    </section>
  );
}
