import { useState } from "react";

/* ── Interactive inputs for preview mode ── */
export function StarRatingInput({ value, onChange }) {
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

export function LinearScaleInput({ value, onChange, labelMin, labelMax }) {
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

