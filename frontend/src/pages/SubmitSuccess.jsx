import { useParams, Link } from "react-router-dom";

export default function SubmitSuccess() {
  const { id } = useParams();

  return (
    <div className="respond-container">
      <div className="success-card">
        <div className="success-icon-circle">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 32.34L9.66 24L6.82 26.82L18 38L42 14L39.18 11.18L18 32.34Z"
              fill="#1e8e3e"
            />
          </svg>
        </div>
        <h1 className="success-title">Jawaban Anda telah dikirim!</h1>
        <p className="success-message">
          Terima kasih telah mengisi formulir ini. Jawaban Anda telah tersimpan.
        </p>
        <div className="success-actions">
          <Link to={`/respond/${id}`} className="btn btn-ghost">
            Kirim jawaban lain
          </Link>
        </div>
      </div>
    </div>
  );
}
