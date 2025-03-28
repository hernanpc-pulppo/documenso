import { createElement } from 'react';

import { mailer } from '@documenso/email/mailer';
import { render } from '@documenso/email/render';
import { DocumentPendingEmailTemplate } from '@documenso/email/templates/document-pending';
import { prisma } from '@documenso/prisma';

import { NEXT_PUBLIC_WEBAPP_URL } from '../../constants/app';

export interface SendPendingEmailOptions {
  documentId: number;
  recipientId: number;
}

export const sendPendingEmail = async ({ documentId, recipientId }: SendPendingEmailOptions) => {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      Recipient: {
        some: {
          id: recipientId,
        },
      },
    },
    include: {
      Recipient: {
        where: {
          id: recipientId,
        },
      },
    },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  if (document.Recipient.length === 0) {
    throw new Error('Document has no recipients');
  }

  const [recipient] = document.Recipient;

  const { email, name } = recipient;

  const assetBaseUrl = NEXT_PUBLIC_WEBAPP_URL() || 'http://localhost:3000';

  const template = createElement(DocumentPendingEmailTemplate, {
    documentName: document.title,
    assetBaseUrl,
  });

  await mailer.sendMail({
    to: {
      address: email,
      name,
    },
    from: {
      name: process.env.NEXT_PRIVATE_SMTP_FROM_NAME || 'Documenso',
      address: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS || 'noreply@documenso.com',
    },
    subject: 'Esperando que todos terminen de firmar.',
    html: render(template),
    text: render(template, { plainText: true }),
  });
};
