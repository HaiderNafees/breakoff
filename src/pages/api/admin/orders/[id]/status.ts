import type { NextApiRequest, NextApiResponse } from 'next';
import { body, methodNotAllowed, send } from '@/server/http';
import { advanceOrder, isStatus } from '@/server/orders';
import { publicOrder } from '@/server/store';

/**
 * Merchant-side fulfilment update. Guarded by ADMIN_TOKEN so a customer cannot
 * mark their own parcel delivered.
 *
 *   curl -X POST http://localhost:3000/api/admin/orders/BO-XXXXXX/status \
 *     -H "x-admin-token: $ADMIN_TOKEN" -H "content-type: application/json" \
 *     -d '{"status":"dispatched"}'
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const token = process.env.ADMIN_TOKEN;
  if (!token) return send(res, 503, { error: 'ADMIN_TOKEN is not set, so fulfilment updates are disabled.' });
  if (req.headers['x-admin-token'] !== token) return send(res, 401, { error: 'Not authorised.' });

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  const input = body<{ status?: unknown; note?: unknown; trackingNumber?: unknown }>(req);
  if (!isStatus(input.status)) {
    return send(res, 400, {
      error: 'Status must be placed, confirmed, packed, dispatched, out-for-delivery, delivered or cancelled.',
    });
  }

  const result = await advanceOrder(
    id,
    input.status,
    typeof input.note === 'string' ? input.note : undefined,
    typeof input.trackingNumber === 'string' ? input.trackingNumber : undefined
  );
  if ('error' in result) return send(res, 400, result);

  send(res, 200, { order: publicOrder(result.order) });
}
