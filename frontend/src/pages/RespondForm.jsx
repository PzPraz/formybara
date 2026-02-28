import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicForm, submitResponse } from "../lib/api.js";
import Button from "../components/Button.jsx";
import Spinner from "../components/Spinner.jsx";
import Snackbar from "../components/Snackbar.jsx";

/* ── Interactive Star Rating ── */
function StarRatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="star-rating-preview" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="star-item">
          <span className="star-number">{n}</span>
          <span
            className={`star-icon ${
              n <= (hovered || value) ? "star-filled" : "star-empty"
            }`}
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

/* ── Linear Scale Input ── */
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

/* ── Main component ── */
export default function RespondForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});
  const [respondentName, setRespondentName] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", variant: "default" });

  useEffect(() => {
    loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadForm() {
    setLoading(true);
    setError("");
    try {
      const data = await getPublicForm(id);
      setForm(data);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || "Formulir tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  }

  // Split questions into pages by page_break
  function getPages() {
    const pages = [[]];
    for (const q of questions) {
      if (q.type === "page_break") {
        pages.push([]);
      } else {
        pages[pages.length - 1].push(q);
      }
    }
    return pages;
  }

  const pages = questions.length > 0 ? getPages() : [[]];
  const totalPages = pages.length;
  const currentQuestions = pages[currentPage] || [];

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  function validateCurrentPage() {
    const errors = {};
    for (const q of currentQuestions) {
      if (q.type === "text_block") continue;
      if (q.required) {
        const val = answers[q.id];
        if (!val || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && val.length === 0)) {
          errors[q.id] = "Pertanyaan ini wajib dijawab.";
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (!validateCurrentPage()) return;
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrev() {
    setCurrentPage((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateCurrentPage()) return;

    setSubmitting(true);
    try {
      await submitResponse(id, {
        respondentName: respondentName.trim() || undefined,
        answers,
      });
      navigate(`/respond/${id}/success`, { replace: true });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Gagal mengirim jawaban.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle a value in a multi-select answers array
  function toggleMulti(questionId, option) {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter((v) => v !== option) };
      }
      return { ...prev, [questionId]: [...current, option] };
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }

  /* ── Render ── */

  if (loading) {
    return (
      <div className="respond-container">
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="respond-container">
        <div className="respond-error-card">
          <img src="/permission-denied.png" alt="permission denied" style={{ maxWidth: '280px', marginBottom: '1rem' }} />
          <h2>Formulir Tidak Tersedia</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="respond-container">
      {/* Form header */}
      <div className="respond-header-card">
        <h1 className="respond-title">{form.title}</h1>
        {form.description && (
          <p className="respond-description">{form.description}</p>
        )}
        {totalPages > 1 && (
          <div className="respond-progress">
            <div className="respond-progress-bar">
              <div
                className="respond-progress-fill"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
            <span className="respond-progress-text">
              Halaman {currentPage + 1} dari {totalPages}
            </span>
          </div>
        )}
        <p className="respond-required-note"><span className="required-mark">*</span> Menandakan pertanyaan wajib diisi</p>
      </div>

      {/* Respondent name (optional, first page only) */}
      {currentPage === 0 && (
        <div className="respond-question-card">
          <label className="field">
            <span className="field-label">Nama Anda (opsional)</span>
            <input
              type="text"
              className="field-input"
              placeholder="Masukkan nama Anda"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
            />
          </label>
        </div>
      )}

      {/* Questions */}
      {currentQuestions.map((q) => {
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
            className={`respond-question-card ${fieldErrors[q.id] ? "respond-question-card-error" : ""}`}
          >
            <p className="respond-question-title">
              {q.title}
              {q.required && <span className="required-mark">*</span>}
            </p>

            {/* Short answer */}
            {q.type === "short_answer" && (
              <input
                type="text"
                className="field-input"
                placeholder="Jawaban Anda"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}

            {/* Long answer */}
            {q.type === "long_answer" && (
              <textarea
                className="field-input field-textarea"
                placeholder="Jawaban Anda"
                rows={4}
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            )}

            {/* Multiple choice (radio) */}
            {q.type === "multiple_choice" && !q.allowMultiple && (
              <div className="respond-options">
                {(q.options || []).map((opt, i) => (
                  <label key={i} className="respond-radio-option">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
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
                    }}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Multiple choice (checkbox) */}
            {q.type === "multiple_choice" && q.allowMultiple && (
              <div className="respond-options">
                {(q.options || []).map((opt, i) => (
                  <label key={i} className="respond-checkbox-option">
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(opt)}
                      onChange={() => toggleMulti(q.id, opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Dropdown */}
            {q.type === "multiple_choice_dropdown" && (
              <select
                className="field-input respond-select"
                value={answers[q.id] || ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              >
                <option value="">Pilih opsi</option>
                {(q.options || []).map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* Linear scale */}
            {q.type === "linear_scale" && (
              <LinearScaleInput
                value={answers[q.id] || ""}
                onChange={(val) => setAnswer(q.id, val)}
                labelMin={q.labelMin}
                labelMax={q.labelMax}
              />
            )}

            {/* Star rating */}
            {q.type === "star_rating" && (
              <StarRatingInput
                value={Number(answers[q.id]) || 0}
                onChange={(val) => setAnswer(q.id, String(val))}
              />
            )}

            {fieldErrors[q.id] && (
              <span className="field-error">{fieldErrors[q.id]}</span>
            )}
          </div>
        );
      })}

      {/* Navigation buttons */}
      <div className="respond-nav-buttons">
        {currentPage > 0 && (
          <Button variant="ghost" onClick={handlePrev}>
            Sebelumnya
          </Button>
        )}
        <div style={{ flex: 1 }} />
        {currentPage < totalPages - 1 ? (
          <Button onClick={handleNext}>Selanjutnya</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Mengirim..." : "Kirim"}
          </Button>
        )}
      </div>

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
    </div>
  );
}
