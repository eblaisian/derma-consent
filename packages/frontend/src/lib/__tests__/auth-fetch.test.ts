import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthFetcher } from '../api';

describe('createAuthFetcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should add Authorization header when accessToken is provided', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ data: 'test' }) };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const fetcher = createAuthFetcher('my-token-123');
    await fetcher('http://localhost:3001/api/test');

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/api/test', {
      headers: { Authorization: 'Bearer my-token-123' },
    });
  });

  it('should not add Authorization header when no token', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({}) };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const fetcher = createAuthFetcher(undefined);
    await fetcher('http://localhost:3001/api/test');

    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/api/test', {
      headers: {},
    });
  });

  it('should throw error when response is not ok', async () => {
    const mockResponse = { ok: false, status: 500 };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const fetcher = createAuthFetcher('token');

    await expect(fetcher('http://localhost:3001/api/test')).rejects.toThrow(
      'Request failed',
    );
  });

  it('should return parsed JSON on success', async () => {
    const data = { items: [{ id: '1' }], total: 1 };
    const mockResponse = { ok: true, json: () => Promise.resolve(data) };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

    const fetcher = createAuthFetcher('token');
    const result = await fetcher('http://localhost:3001/api/test');

    expect(result).toEqual(data);
  });
});
