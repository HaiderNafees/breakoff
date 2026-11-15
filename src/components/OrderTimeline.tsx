import { ORDER_FLOW, STATUS_LABEL } from '@/lib/types';
import type { Order } from '@/lib/types';

export function shortDate(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * The tracking ladder. Every reached rung shows the timestamp recorded by the
 * server; rungs still ahead are outlined.
 */
export default function OrderTimeline({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  if (order.status === 'cancelled') {
    return (
      <div className="timeline timeline--cancelled">
        <p className="timeline__cancelled">
          This order was cancelled. Nothing further is on its way.
        </p>
      </div>
    );
  }

  const current = ORDER_FLOW.findIndex((step) => step.key === order.status);

  return (
    <ol className={compact ? 'timeline timeline--compact' : 'timeline'} aria-label="Order progress">
      {ORDER_FLOW.map((step, index) => {
        const event = order.events.find((item) => item.status === step.key);
        const done = Boolean(event) || index <= current;
        const isCurrent = index === current;
        return (
          <li
            key={step.key}
            className={`timeline__step${done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="timeline__dot" aria-hidden="true">
              {done ? '✓' : ''}
            </span>
            <span className="timeline__body">
              <span className="timeline__label">
                {compact ? STATUS_LABEL[step.key] : step.label}
              </span>
              {!compact ? <span className="timeline__note">{event?.note || step.note}</span> : null}
              {event ? <span className="timeline__time">{shortDate(event.at)}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
