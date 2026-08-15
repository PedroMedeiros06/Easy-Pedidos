const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/auth";

export const authApi = {
  async login(payload) {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;

      throw new Error(message || "Falha ao realizar login.");
    }

    return data;
  },
};