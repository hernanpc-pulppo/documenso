import { getFile } from '@documenso/lib/universal/upload/get-file';

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(request: Request, { params }: { params: { parts: string[] } }) {
  const file = await getFile({
    type: 'S3_PATH',
    data: params?.parts?.join('/'),
  });
  // await generateContracts();
  // await writeFile(`${id}.pdf`, buffer);

  return new Response(file, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-disposition': 'inline',
      'Content-Length': `${file.length}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
