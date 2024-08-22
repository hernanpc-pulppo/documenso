import fs from 'node:fs';

import { signWithP12 } from '@documenso/pdf-sign';

import { addSigningPlaceholder } from '../helpers/add-signing-placeholder';
import { updateSigningPlaceholder } from '../helpers/update-signing-placeholder';

export type SignWithLocalCertOptions = {
  pdf: Buffer;
};

export const signWithLocalCert = async ({ pdf }: SignWithLocalCertOptions) => {
  console.log('Signing with local cert');
  const newPdf = await addSigningPlaceholder({ pdf });

  console.log('Added placeholder');
  const { pdf: pdfWithPlaceholder, byteRange } = updateSigningPlaceholder({
    pdf: newPdf,
  });

  console.log('Updated placeholder');

  const pdfWithoutSignature = Buffer.concat([
    pdfWithPlaceholder.subarray(0, byteRange[1]),
    pdfWithPlaceholder.subarray(byteRange[2]),
  ]);

  const signatureLength = byteRange[2] - byteRange[1];

  let cert: Buffer | null = null;

  if (process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS) {
    console.log('Using local cert');
    cert = Buffer.from(process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS, 'base64');
  }

  if (!cert) {
    console.log('Using default cert');
    cert = Buffer.from(
      fs.readFileSync(process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH || './example/cert.p12'),
    );
  }

  const signature = signWithP12({
    cert,
    content: pdfWithoutSignature,
    password: process.env.NEXT_PRIVATE_SIGNING_PASSPHRASE || undefined,
  });

  console.log('Signed with p12');

  const signatureAsHex = signature.toString('hex');

  const signedPdf = Buffer.concat([
    pdfWithPlaceholder.subarray(0, byteRange[1]),
    Buffer.from(`<${signatureAsHex.padEnd(signatureLength - 2, '0')}>`),
    pdfWithPlaceholder.subarray(byteRange[2]),
  ]);

  return signedPdf;
};
