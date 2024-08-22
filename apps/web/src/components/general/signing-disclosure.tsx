import type { HTMLAttributes } from 'react';

import Link from 'next/link';

import { cn } from '@documenso/ui/lib/utils';

export type SigningDisclosureProps = HTMLAttributes<HTMLParagraphElement>;

export const SigningDisclosure = ({ className, ...props }: SigningDisclosureProps) => {
  return (
    <p className={cn('text-muted-foreground text-xs', className)} {...props}>
      Al proceder con tu firma electrónica, reconoces y aceptas que será utilizada para firmar el documento proporcionado y tiene la misma validez legal que una firma manuscrita. Al completar el proceso de firma electrónica, afirmas tu comprensión y aceptación de estas condiciones.
      <span className="mt-2 block">
        Lee el artículo completo sobre{' '}
        <Link
          className="text-documenso-700 underline"
          href="/articles/signature-disclosure"
          target="_blank"
        >
          firma electrónica
        </Link>
        .
      </span>
    </p>
  );
};
