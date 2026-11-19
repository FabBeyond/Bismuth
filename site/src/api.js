import { useEffect, useState } from "react";

export const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

export function useApi(path) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    //eslint-disable-next-line
    setState((s) => ({ ...s, loading: true }));
    api(path)
      .then(
        (data) => !ignore && setState({ data, error: null, loading: false }),
      )
      .catch(
        (error) => !ignore && setState({ data: null, error, loading: false }),
      );
    return () => {
      ignore = true;
    };
  }, [path, version]);

  return { ...state, reload: () => setVersion((v) => v + 1) };
}
