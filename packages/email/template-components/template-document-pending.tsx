import { Column, Img, Section, Text } from '../components';
import { TemplateDocumentImage } from './template-document-image';

export interface TemplateDocumentPendingProps {
  documentName: string;
  assetBaseUrl: string;
}

export const TemplateDocumentPending = ({
  documentName,
  assetBaseUrl,
}: TemplateDocumentPendingProps) => {
  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  return (
    <>
      <TemplateDocumentImage className="mt-6" assetBaseUrl={assetBaseUrl} />

      <Section>
        <Section className="mb-4">
          <Column align="center">
            <Text className="text-base font-semibold text-blue-500">
              <Img
                src={getAssetUrl('/static/clock.png')}
                className="-mt-0.5 mr-2 inline h-7 w-7 align-middle"
              />
              Esperando a los demás
            </Text>
          </Column>
        </Section>

        <Text className="text-primary mb-0 text-center text-lg font-semibold">
          “{documentName}” ha sido firmado
        </Text>

        <Text className="mx-auto mb-6 mt-1 max-w-[80%] text-center text-base text-slate-400">
          Todavía estamos esperando que otros firmantes firmen este documento.
          <br />
          Te notificaremos tan pronto como esté listo.
        </Text>
      </Section>
    </>
  );
};

export default TemplateDocumentPending;
