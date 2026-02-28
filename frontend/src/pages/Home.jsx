import { Link } from 'react-router-dom'
import { getToken } from '../lib/api.js'

export default function Home() {
  const isAuthenticated = !!getToken()

  return (
    <section className="page">
      <div className="page-hero">
        <h1>Form Builder</h1>
        <p className="subtext">
          Buat dan kelola formulir online dengan mudah, mirip seperti Google Forms.
          Kumpulkan data, buat survei, dan analisis hasil dengan tampilan yang modern.
        </p>
        <img src="/cta.png" alt="Form Builder" className="hero-img" />
        <div className="action-row" style={{ marginTop: '1.5rem' }}>
          {isAuthenticated ? (
            <Link to="/forms">
              <button className="btn btn-primary">Lihat Forms Saya</button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <button className="btn btn-primary">Mulai Sekarang</button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>Fitur Utama</h3>
        <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          <li>Buat form dengan berbagai jenis pertanyaan</li>
          <li>Kelola status form (draft, published, closed)</li>
          <li>Antarmuka yang responsif dan modern</li>
          <li>Autentikasi dan keamanan data</li>
        </ul>
      </div>
    </section>
  )
}
