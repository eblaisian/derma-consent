export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function createAuthFetcher(accessToken?: string) {
  return (url: string) =>
    fetch(url, {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    }).then((res) => {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    });
}

export const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Request failed');
    return res.json();
  });
