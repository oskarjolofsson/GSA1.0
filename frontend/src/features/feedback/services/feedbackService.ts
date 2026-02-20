const API = import.meta.env.VITE_API_URL;

async function feedbackFetch(
  token: string,
  method: string,
  body?: any
) {
  const res = await fetch(`${API}/api/v1/feedback`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.detail || `HTTP ${res.status}`);
  }

  return json;
}

export const feedbackService = {
  async submitFeedback(
    token: string,
    rating: number,
    comments?: string
  ) {
    if (!rating) {
      throw new Error("Rating is required");
    }

    return feedbackFetch(token, "POST", {
      rating,
      comments: comments ?? "",
    });
  },
};
