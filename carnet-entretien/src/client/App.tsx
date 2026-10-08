import { useEffect, useState } from 'react';

type ApiState = 'chargement' | 'ok' | 'erreur';

export function App() {
  const [api, setApi] = useState<ApiState>('chargement');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/v1/ping', { signal: controller.signal })
      .then(async (res) => {
        const body: unknown = await res.json();
        const pong = typeof body === 'object' && body !== null && 'pong' in body && body.pong === true;
        setApi(res.ok && pong ? 'ok' : 'erreur');
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) setApi('erreur');
      });
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main>
      <h1>Carnet d'entretien</h1>
      <p>API : {api}</p>
    </main>
  );
}
