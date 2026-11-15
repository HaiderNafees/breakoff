import Link from 'next/link';
import type { ReactNode } from 'react';
import Photo from '@/components/Photo';

type Props = {
  eyebrow: string;
  title: string;
  sub: string;
  image: string;
  children: ReactNode;
  footer: ReactNode;
};

export default function AuthShell({ eyebrow, title, sub, image, children, footer }: Props) {
  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__inner">
          <Link href="/" className="auth__brand" aria-label="BreakOff home">
            BreakOff
          </Link>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="auth__title">{title}</h1>
          <p className="auth__sub">{sub}</p>
          {children}
          <div className="auth__footer">{footer}</div>
          <p className="auth__note">
            Preview accounts are stored in this browser only. No password leaves this device.
          </p>
        </div>
      </div>
      <div className="auth__art" aria-hidden="true">
        <Photo
          images={[image]}
          silhouette="coat"
          tone="dark"
          alt=""
          priority
          sizes="(max-width: 860px) 0px, 50vw"
        />
        <p className="auth__caption">
          <span>BreakOff</span>
          <span>Autumn / Winter 26</span>
        </p>
      </div>
    </div>
  );
}
