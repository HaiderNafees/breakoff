import type { NextApiRequest, NextApiResponse } from 'next';

export function send(res: NextApiResponse, status: number, body: unknown): void {
  res.status(status).setHeader('Cache-Control', 'no-store');
  res.json(body);
}

export function methodNotAllowed(res: NextApiResponse, allowed: string[]): void {
  res.setHeader('Allow', allowed.join(', '));
  send(res, 405, { error: 'Method not allowed.' });
}

export function body<T = Record<string, unknown>>(req: NextApiRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      return {} as T;
    }
  }
  return req.body as T;
}
