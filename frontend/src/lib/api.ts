// frontend/src/lib/api.ts

// Updated to match your backend port from the terminal logs
const BASE_URL = 'http://localhost:3001'; 

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Attempt to parse error message from the backend
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    // Handle 204 No Content responses (like Logout)
    if (response.status === 204) return null;

    return response.json();
  } catch (error: any) {
    console.error("API Request Failed:", error.message);
    throw error;
  }
}