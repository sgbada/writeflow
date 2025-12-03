const BASE = "/api";

function authHeaders() {
  const token = localStorage.getItem("accessToken");
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

export async function apiGet(url: string) {
  const res = await fetch(BASE + url, {
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(url: string, body?: any) {
  const res = await fetch(BASE + url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(url: string) {
  const res = await fetch(BASE + url, {
    method: "DELETE",
    headers: {
      ...authHeaders(),
    },
    credentials: "include",
  });

  if (!res.ok) throw new Error(await res.text());
  return true;
}
