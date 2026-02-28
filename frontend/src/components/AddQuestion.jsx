import { useEffect, useState } from "react";
import Button from "./Button.jsx";

function StarRatingFormPreview() {
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

const TYPES_WITH_OPTIONS = ["multiple_choice", "multiple_choice_dropdown"];
const TYPES_WITHOUT_REQUIRED = ["page_break", "text_block"];
const TYPES_WITHOUT_OPTIONS = ["short_answer", "long_answer", "page_break", "text_block", "linear_scale", "star_rating", "date_picker"];

export default function AddQuestion({
  onCancel,
  onSubmit,
  initialType,
  initialData,
  submitLabel,
  disableTypeChange,
}) {
  const [questionData, setQuestionData] = useState({
    type: initialData?.type || initialType || "short_answer",
    title: initialData?.title || "",
    required: initialData?.required || false,
    options: initialData?.options?.length ? initialData.options : [""],
    allowMultiple: initialData?.allowMultiple || false,
    labelMin: initialData?.labelMin || "",
    labelMax: initialData?.labelMax || "",
  });
  const [hasDuplicateError, setHasDuplicateError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setQuestionData({
        type: initialData.type || initialType || "short_answer",
        title: initialData.title || "",
        required: initialData.required || false,
        options: initialData.options?.length ? initialData.options : [""],
        allowMultiple: initialData.allowMultiple || false,
        labelMin: initialData.labelMin || "",
        labelMax: initialData.labelMax || "",
      });
    }
  }, [initialData, initialType]);

  const handleTypeChange = (newType) => {
    setQuestionData((prev) => ({
      ...prev,
      type: newType,
      options: TYPES_WITH_OPTIONS.includes(newType) ? prev.options : [""],
      allowMultiple: newType === "multiple_choice" ? prev.allowMultiple : false,
    }));
  };

  const handleAddOption = () => {
    setQuestionData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const handleRemoveOption = (index) => {
    if (questionData.options.length > 1) {
      setQuestionData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    setQuestionData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (questionData.type !== "page_break" && !questionData.title.trim()) {
      alert("Pertanyaan harus diisi");
      return;
    }

    if (TYPES_WITH_OPTIONS.includes(questionData.type)) {
      const hasEmptyOption = questionData.options.some((opt) => !opt.trim());
      if (hasEmptyOption) {
        alert("Semua pilihan harus diisi");
        return;
      }
    }

    onSubmit({
      ...questionData,
      title:
        questionData.type === "page_break"
          ? questionData.title.trim() || "Page Break"
          : questionData.title.trim(),
      options: TYPES_WITH_OPTIONS.includes(questionData.type)
        ? questionData.options.filter((opt) => opt.trim())
        : [],
      required: TYPES_WITHOUT_REQUIRED.includes(questionData.type)
        ? false
        : questionData.required,
      labelMin: questionData.type === "linear_scale" ? questionData.labelMin.trim() : undefined,
      labelMax: questionData.type === "linear_scale" ? questionData.labelMax.trim() : undefined,
    });
  };

  const typeLabel = {
    short_answer: "Pertanyaan Singkat",
    long_answer: "Pertanyaan Panjang",
    multiple_choice: "Pilihan Ganda",
    multiple_choice_dropdown: "Pilihan Ganda Dropdown",
    page_break: "Page Break",
    text_block: "Blok Teks",
    linear_scale: "Skala Linier",
    star_rating: "Rating Bintang",
    date_picker: "Pemilih Tanggal",
  }[questionData.type] || "Pertanyaan Baru";


  const getDuplicateIndices = () => {
    if (!TYPES_WITH_OPTIONS.includes(questionData.type)) return [];
    
    const normalized = questionData.options.map(opt => opt.trim().toLowerCase());
    return normalized.map((val, idx) => {
      if (!val) return false;
      return normalized.indexOf(val) !== idx || normalized.lastIndexOf(val) !== idx;
    });
  };

  const duplicateMap = getDuplicateIndices();
  const hasDuplicates = duplicateMap.some(isDup => isDup === true);
  const isSubmitDisabled = hasDuplicates || (questionData.type !== "page_break" && !questionData.title.trim());

  return (
    <div className="question-card question-card-accent">
      <div className="question-card-body">
        <div className="question-card-header-row">
          <h4>{typeLabel}</h4>
        </div>

        <form onSubmit={handleSubmit} className="stack">
          {questionData.type === "page_break" ? (
            <div className="field">
              <label className="field-label">Judul Bagian (opsional)</label>
              <input
                type="text"
                className="field-input"
                placeholder="Contoh: Bagian 2"
                value={questionData.title}
                onChange={(e) =>
                  setQuestionData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
          ) : questionData.type === "text_block" ? (
            <div className="field">
              <label className="field-label">Konten Teks</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Masukkan teks yang ingin ditampilkan"
                value={questionData.title}
                rows={3}
                onChange={(e) =>
                  setQuestionData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
          ) : questionData.type === "long_answer" ? (
            <div className="field">
              <label className="field-label">Teks Pertanyaan</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Masukkan pertanyaan (jawaban panjang)"
                value={questionData.title}
                rows={3}
                onChange={(e) =>
                  setQuestionData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
          ) : (
            <div className="field">
              <label className="field-label">Teks Pertanyaan</label>
              <input
                type="text"
                className="field-input"
                placeholder="Masukkan pertanyaan"
                value={questionData.title}
                onChange={(e) =>
                  setQuestionData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
          )}

          {questionData.type !== "page_break" &&
            questionData.type !== "text_block" && (
              <div className="field">
                <label className="field-label">Jenis Pertanyaan</label>
                {disableTypeChange && (
                  <p className="field-hint" style={{ color: "#b45309", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                    Tipe pertanyaan tidak dapat diubah karena form sudah memiliki respons.
                  </p>
                )}
                <div className="question-type-group">
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "short_answer" ? "active" : ""
                    }`}
                    onClick={() => handleTypeChange("short_answer")}
                    disabled={disableTypeChange}
                  >
                    Jawaban Singkat
                  </button>
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "long_answer" ? "active" : ""
                    }`}
                    onClick={() => handleTypeChange("long_answer")}
                    disabled={disableTypeChange}
                  >
                    Jawaban Panjang
                  </button>
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "multiple_choice" ? "active" : ""
                    }`}
                    onClick={() => handleTypeChange("multiple_choice")}
                    disabled={disableTypeChange}
                  >
                    Pilihan Ganda
                  </button>
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "multiple_choice_dropdown"
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleTypeChange("multiple_choice_dropdown")}
                    disabled={disableTypeChange}
                  >
                    Dropdown
                  </button>
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "date_picker" ? "active" : ""
                    }`}
                    onClick={() => handleTypeChange("date_picker")}
                    disabled={disableTypeChange}
                  >
                    Tanggal
                  </button>
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "linear_scale" ? "active" : ""
                    }`}
                    onClick={() => handleTypeChange("linear_scale")}
                    disabled={disableTypeChange}
                  >
                    Skala Linier
                  </button>
                  <button
                    type="button"
                    className={`question-type-btn ${
                      questionData.type === "star_rating" ? "active" : ""
                    }`}
                    onClick={() => handleTypeChange("star_rating")}
                    disabled={disableTypeChange}
                  >
                    Rating Bintang
                  </button>
                </div>
              </div>
            )}

          {TYPES_WITH_OPTIONS.includes(questionData.type) && (
            <>
              {questionData.type === "multiple_choice" && (
                <div className="field">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={questionData.allowMultiple}
                      onChange={(e) =>
                        setQuestionData((prev) => ({
                          ...prev,
                          allowMultiple: e.target.checked,
                        }))
                      }
                    />
                    <span>Izinkan memilih lebih dari satu jawaban</span>
                  </label>
                </div>
              )}

              <div className="field">
                <label className="field-label">Pilihan Jawaban</label>
                <div className="options-list">
                  {questionData.options.map((option, index) => {
                    const isDup = duplicateMap[index];

                    return (
                      <div key={index} className="option-row-container">
                        <div className="option-row">
                          <input
                            type="text"
                            className={`field-input ${isDup ? "field-input-error" : ""}`}
                            style={isDup ? { 
                              borderColor: "#dc2626", 
                              backgroundColor: "#fef2f2",
                              outlineColor: "#dc2626" 
                            } : {}}
                            placeholder={`Pilihan ${index + 1}`}
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                          />
                          {questionData.options.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-option"
                              onClick={() => handleRemoveOption(index)}
                            >
                              x
                            </button>
                          )}
                        </div>
                        {isDup && (
                          <span style={{ color: "#dc2626", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                            Pilihan ini duplikat
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="btn btn-add-option"
                  onClick={handleAddOption}
                >
                  + Tambah Pilihan
                </button>
              </div>
            </>
          )}

          {questionData.type === "long_answer" && (
            <div className="field">
              <label className="field-label">Preview</label>
              <textarea
                className="field-input field-textarea"
                placeholder="Responden akan menjawab di sini..."
                rows={4}
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
            </div>
          )}

          {questionData.type === "date_picker" && (
          <div className="field">
            <label className="field-label">Preview</label>
            <div className="date-picker-preview">
              <input 
                type="date"
                className="field-input"
                disabled
                style={{
                  backgroundColor: "#f5f5f5",
                  cursor: "not-allowed",
                  color: "#999"
                }}
              />
              <p className="field-hint" style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                Responden akan melihat pemilih tanggal standar browser.
              </p>
            </div>
          </div>
          )}

          {questionData.type === "linear_scale" && (
            <>
              <div className="field">
                <label className="field-label">Label Minimum (opsional)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Contoh: Sangat Tidak Setuju"
                  value={questionData.labelMin}
                  onChange={(e) =>
                    setQuestionData((prev) => ({ ...prev, labelMin: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label className="field-label">Label Maksimum (opsional)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Contoh: Sangat Setuju"
                  value={questionData.labelMax}
                  onChange={(e) =>
                    setQuestionData((prev) => ({ ...prev, labelMax: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label className="field-label">Preview</label>
                <div className="linear-scale-form-preview">
                  <div className="rating-preview">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="rating-circle">
                        {n}
                      </div>
                    ))}
                  </div>
                  {(questionData.labelMin || questionData.labelMax) && (
                    <div className="scale-labels-row">
                      <span className="scale-label-text">{questionData.labelMin || ""}</span>
                      <span className="scale-label-text">{questionData.labelMax || ""}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {questionData.type === "star_rating" && (
            <div className="field">
              <label className="field-label">Preview</label>
              <StarRatingFormPreview />
            </div>
          )}

          {!TYPES_WITHOUT_REQUIRED.includes(questionData.type) && (
            <div className="field">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={questionData.required}
                  onChange={(e) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      required: e.target.checked,
                    }))
                  }
                />
                <span>Pertanyaan wajib dijawab</span>
              </label>
            </div>
          )}

          <div className="action-row">
            <Button type="submit" disabled={isSubmitDisabled}>
              {submitLabel ||
                (questionData.type === "page_break"
                  ? "Tambah Page Break"
                  : questionData.type === "text_block"
                  ? "Tambah Blok Teks"
                  : "Tambah Pertanyaan")}
            </Button>
            {onCancel && (
              <Button variant="ghost" type="button" onClick={onCancel}>
                Batal
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
