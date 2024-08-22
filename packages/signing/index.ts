import { match } from 'ts-pattern';

import { signWithGoogleCloudHSM } from './transports/google-cloud-hsm';
import { signWithLocalCert } from './transports/local-cert';

export type SignOptions = {
  pdf: Buffer;
};

export const signPdf = async ({ pdf }: SignOptions) => {
  const transport = process.env.NEXT_PRIVATE_SIGNING_TRANSPORT || 'local';

  return await match(transport)
    .with('local', async () => signWithLocalCert({ pdf }))
    .with('gcloud-hsm', async () => signWithGoogleCloudHSM({ pdf }))
    .otherwise(() => {
      console.error(`Unsupported signing transport: ${transport}`);
      throw new Error(`Unsupported signing transport: ${transport}`);
    });
};
