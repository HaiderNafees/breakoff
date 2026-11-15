import type { NextApiRequest, NextApiResponse } from 'next';
import { body, methodNotAllowed, send } from '@/server/http';
import { currentUser, userPayload } from '@/server/auth';
import { mutate } from '@/server/store';
import type { Address } from '@/lib/types';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const PROVINCES = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST', 'DELETE'].includes(req.method ?? '')) {
    return methodNotAllowed(res, ['GET', 'POST', 'DELETE']);
  }

  const session = await currentUser(req);
  if (!session) return send(res, 401, { error: 'Sign in to manage addresses.' });

  if (req.method === 'GET') {
    return send(res, 200, { addresses: session.addresses, user: await userPayload(session) });
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    if (!id) return send(res, 400, { error: 'Which address should be removed?' });
    const user = await mutate((data) => {
      const found = data.users.find((item) => item.id === session.id);
      if (!found) return null;
      found.addresses = found.addresses.filter((address) => address.id !== id);
      return found;
    });
    if (!user) return send(res, 404, { error: 'Account not found.' });
    return send(res, 200, { user: await userPayload(user) });
  }

  const input = body<Partial<Address>>(req);
  const address: Address = {
    id: text(input.id) || `a_${Date.now().toString(36)}`,
    label: text(input.label) || 'Home',
    name: text(input.name),
    phone: text(input.phone),
    line1: text(input.line1),
    line2: text(input.line2) || undefined,
    city: text(input.city),
    province: PROVINCES.includes(text(input.province)) ? text(input.province) : 'Punjab',
    postal: text(input.postal),
  };

  if (!address.name || !address.line1 || !address.city) {
    return send(res, 400, { error: 'Name, address and city are required.' });
  }
  if (address.phone.replace(/\D/g, '').length < 10) {
    return send(res, 400, { error: 'Enter a valid phone number.' });
  }

  const user = await mutate((data) => {
    const found = data.users.find((item) => item.id === session.id);
    if (!found) return null;
    const exists = found.addresses.some((item) => item.id === address.id);
    found.addresses = exists
      ? found.addresses.map((item) => (item.id === address.id ? address : item))
      : [...found.addresses, address];
    return found;
  });

  if (!user) return send(res, 404, { error: 'Account not found.' });
  send(res, 200, { user: await userPayload(user) });
}
