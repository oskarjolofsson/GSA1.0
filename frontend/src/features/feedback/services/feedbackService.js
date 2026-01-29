const API = import.meta.env.VITE_API_URL;

async function feedbackFetch(
  fetcher,
  token,
  endpoint,
  method,
  body
) {
  const res = await fetcher(`${API}/api/v1/feedback/${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }

  return json;
}

export const feedbackService = {
  async submitFeedback(
    fetcher,
    token,
    rating,
    comments
  ) {
    if (!rating) {
      throw new Error("Rating is required");
    }

    return feedbackFetch(fetcher, token, "give", "POST", {
      rating,
      comments: comments ?? "",
    });
  },
};
