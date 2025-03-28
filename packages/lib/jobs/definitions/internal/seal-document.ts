import { nanoid } from 'nanoid';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';

import { prisma } from '@documenso/prisma';
import {
  DocumentStatus,
  RecipientRole,
  SigningStatus,
  WebhookTriggerEvents,
} from '@documenso/prisma/client';
import { signPdf } from '@documenso/signing';

import { sendCompletedEmail } from '../../../server-only/document/send-completed-email';
import PostHogServerClient from '../../../server-only/feature-flags/get-post-hog-server-client';
import { getCertificatePdf } from '../../../server-only/htmltopdf/get-certificate-pdf';
import { flattenAnnotations } from '../../../server-only/pdf/flatten-annotations';
import { flattenForm } from '../../../server-only/pdf/flatten-form';
import { insertFieldInPDF } from '../../../server-only/pdf/insert-field-in-pdf';
import { normalizeSignatureAppearances } from '../../../server-only/pdf/normalize-signature-appearances';
import { triggerWebhook } from '../../../server-only/webhooks/trigger/trigger-webhook';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../../types/document-audit-logs';
import { ZRequestMetadataSchema } from '../../../universal/extract-request-metadata';
import { getFile } from '../../../universal/upload/get-file';
import { putPdfFile } from '../../../universal/upload/put-file';
import { createDocumentAuditLogData } from '../../../utils/document-audit-logs';
import { type JobDefinition } from '../../client/_internal/job';

const SEAL_DOCUMENT_JOB_DEFINITION_ID = 'internal.seal-document';

const SEAL_DOCUMENT_JOB_DEFINITION_SCHEMA = z.object({
  documentId: z.number(),
  sendEmail: z.boolean().optional(),
  isResealing: z.boolean().optional(),
  requestMetadata: ZRequestMetadataSchema.optional(),
});

export const SEAL_DOCUMENT_JOB_DEFINITION = {
  id: SEAL_DOCUMENT_JOB_DEFINITION_ID,
  name: 'Seal Document',
  version: '1.0.0',
  trigger: {
    name: SEAL_DOCUMENT_JOB_DEFINITION_ID,
    schema: SEAL_DOCUMENT_JOB_DEFINITION_SCHEMA,
  },
  handler: async ({ payload, io }) => {
    try {
      const { documentId, sendEmail = true, isResealing = false, requestMetadata } = payload;
      console.log('Running job');
      const document = await prisma.document.findFirstOrThrow({
        where: {
          id: documentId,
          Recipient: {
            every: {
              signingStatus: SigningStatus.SIGNED,
            },
          },
        },
        include: {
          Recipient: true,
        },
      });
      console.log('Got document');
      // Seems silly but we need to do this in case the job is re-ran
      // after it has already run through the update task further below.
      // eslint-disable-next-line @typescript-eslint/require-await
      const documentStatus = await io.runTask('get-document-status', async () => {
        return document.status;
      });

      console.log('Got document status');
      // This is the same case as above.
      // eslint-disable-next-line @typescript-eslint/require-await
      const documentDataId = await io.runTask('get-document-data-id', async () => {
        return document.documentDataId;
      });

      console.log('Got document data id');
      const documentData = await prisma.documentData.findFirst({
        where: {
          id: documentDataId,
        },
      });
      console.log('Got document data');

      if (!documentData) {
        console.log('No document data');
        throw new Error(`Document ${document.id} has no document data`);
      }

      const recipients = await prisma.recipient.findMany({
        where: {
          documentId: document.id,
          role: {
            not: RecipientRole.CC,
          },
        },
      });
      console.log('Got recipients');

      if (recipients.some((recipient) => recipient.signingStatus !== SigningStatus.SIGNED)) {
        console.log('Some recipients not signed');
        throw new Error(`Document ${document.id} has unsigned recipients`);
      }

      const fields = await prisma.field.findMany({
        where: {
          documentId: document.id,
        },
        include: {
          Signature: true,
        },
      });
      console.log('Got fields');

      if (fields.some((field) => !field.inserted)) {
        console.log('Some fields not inserted');
        throw new Error(`Document ${document.id} has unsigned fields`);
      }

      if (isResealing) {
        // If we're resealing we want to use the initial data for the document
        // so we aren't placing fields on top of eachother.
        documentData.data = documentData.initialData;
      }

      const pdfData = await getFile(documentData);
      console.log('Got pdf data');
      const certificateData = await getCertificatePdf({ documentId }).catch(() => null);
      console.log('Got certificate data');

      const newDataId = await io.runTask('decorate-and-sign-pdf', async () => {
        console.log('Decorating and signing PDF');
        const pdfDoc = await PDFDocument.load(pdfData);
        console.log('Got pdf doc');

        // Normalize and flatten layers that could cause issues with the signature
        normalizeSignatureAppearances(pdfDoc);
        console.log('Normalized signature appearances');
        flattenForm(pdfDoc);
        console.log('Flattened form');
        flattenAnnotations(pdfDoc);
        console.log('Flattened annotations');

        if (certificateData) {
          console.log('Adding certificate to PDF');
          const certificateDoc = await PDFDocument.load(certificateData);

          console.log('Got certificate doc');
          const certificatePages = await pdfDoc.copyPages(
            certificateDoc,
            certificateDoc.getPageIndices(),
          );

          console.log('Copied pages');

          certificatePages.forEach((page) => {
            pdfDoc.addPage(page);
          });
        }

        for (const field of fields) {
          await insertFieldInPDF(pdfDoc, field);
          console.log('Inserted field');
        }

        // Re-flatten the form to handle our checkbox and radio fields that
        // create native arcoFields
        flattenForm(pdfDoc);

        console.log('Saving PDF');
        const pdfBytes = await pdfDoc.save();

        console.log('Signin PDF');
        const pdfBuffer = await signPdf({ pdf: Buffer.from(pdfBytes) });

        console.log('Got pdf buffer');
        const { name, ext } = path.parse(document.title);

        console.log('Uploading PDF');
        const documentData = await putPdfFile({
          name: `${name}_signed${ext}`,
          type: 'application/pdf',
          arrayBuffer: async () => Promise.resolve(pdfBuffer),
        });

        console.log('uploaded pdf document');

        return documentData.id;
      });

      const postHog = PostHogServerClient();

      if (postHog) {
        postHog.capture({
          distinctId: nanoid(),
          event: 'App: Document Sealed',
          properties: {
            documentId: document.id,
          },
        });
      }

      await io.runTask('update-document', async () => {
        console.log('Updating document');
        await prisma.$transaction(async (tx) => {
          const newData = await tx.documentData.findFirstOrThrow({
            where: {
              id: newDataId,
            },
          });

          await tx.document.update({
            where: {
              id: document.id,
            },
            data: {
              status: DocumentStatus.COMPLETED,
              completedAt: new Date(),
            },
          });

          await tx.documentData.update({
            where: {
              id: documentData.id,
            },
            data: {
              data: newData.data,
            },
          });

          await tx.documentAuditLog.create({
            data: createDocumentAuditLogData({
              type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_COMPLETED,
              documentId: document.id,
              requestMetadata,
              user: null,
              data: {
                transactionId: nanoid(),
              },
            }),
          });
        });
      });

      await io.runTask('send-completed-email', async () => {
        console.log('Sending completed email');
        let shouldSendCompletedEmail = sendEmail && !isResealing;

        if (isResealing && documentStatus !== DocumentStatus.COMPLETED) {
          shouldSendCompletedEmail = sendEmail;
        }

        if (shouldSendCompletedEmail) {
          await sendCompletedEmail({ documentId, requestMetadata });
        }
      });

      const updatedDocument = await prisma.document.findFirstOrThrow({
        where: {
          id: document.id,
        },
        include: {
          documentData: true,
          Recipient: true,
        },
      });

      await triggerWebhook({
        event: WebhookTriggerEvents.DOCUMENT_COMPLETED,
        data: updatedDocument,
        userId: updatedDocument.userId,
        teamId: updatedDocument.teamId ?? undefined,
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
} as const satisfies JobDefinition<
  typeof SEAL_DOCUMENT_JOB_DEFINITION_ID,
  z.infer<typeof SEAL_DOCUMENT_JOB_DEFINITION_SCHEMA>
>;
