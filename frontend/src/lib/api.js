const API_BASE = "http://localhost:3001/api";

// Helper function to handle fetch with timeout and better error handling
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Mohon cek koneksi internet Anda.');
    }
    if (!navigator.onLine) {
      throw new Error('Tidak ada koneksi internet. Mohon cek koneksi Anda.');
    }
    throw new Error('Network error. Mohon coba lagi.');
  }
}

// Helper function to parse error response
async function handleErrorResponse(response) {
  let errorMessage = 'Terjadi kesalahan. Mohon coba lagi.';
  
  try {
    const error = await response.json();
    errorMessage = error.message || error.error || errorMessage;
  } catch (e) {
    // If response is not JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }
  
  // Handle specific status codes
  if (response.status === 401) {
    errorMessage = 'Sesi telah berakhir. Silakan login kembali.';
    clearToken();
  } else if (response.status === 403) {
    errorMessage = 'Anda tidak memiliki akses untuk operasi ini.';
  } else if (response.status === 404) {
    errorMessage = 'Data tidak ditemukan.';
  } else if (response.status === 500) {
    errorMessage = 'Terjadi kesalahan server. Mohon coba lagi.';
  }
  
  throw new Error(errorMessage);
}

export async function registerUser({ name, email, password }) {
  const response = await fetchWithTimeout(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function loginUser({ email, password }) {
  const response = await fetchWithTimeout(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export function storeToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function clearToken() {
  localStorage.removeItem("token");
}

export async function getForms() {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function getFormById(id) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function createForm(data) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function updateForm(id, data) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function deleteForm(id) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

// ==================== Questions API ====================

export async function createQuestion(formId, data) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${formId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function getQuestions(formId) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${formId}/questions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function updateQuestion(formId, questionId, data) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${formId}/questions/${questionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function deleteQuestion(formId, questionId) {
  const token = getToken();
  if (!token) throw new Error("Sesi telah berakhir. Silakan login kembali.");

  const response = await fetchWithTimeout(`${API_BASE}/forms/${formId}/questions/${questionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  return response.json();
}

export async function reorderQuestions(formId, orderedIds) {
    return request(`/api/forms/${formId}/questions/reorder`, {
        method: 'PATCH',
        headers: { ...authHeaders() },
        body: JSON.stringify({ orderedIds }),
    });
}