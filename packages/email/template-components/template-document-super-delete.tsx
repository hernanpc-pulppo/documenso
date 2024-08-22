import { Section, Text } from '../components';
import { TemplateDocumentImage } from './template-document-image';

export interface TemplateDocumentDeleteProps {
  reason: string;
  documentName: string;
  assetBaseUrl: string;
}

export const TemplateDocumentDelete = ({
  reason,
  documentName,
  assetBaseUrl,
}: TemplateDocumentDeleteProps) => {
  return (
    <>
      <TemplateDocumentImage className="mt-6" assetBaseUrl={assetBaseUrl} />

      <Section>
        <Text className="text-primary mb-0 mt-6 text-left text-lg font-semibold">
          ¡Tu documento ha sido eliminado por un administrador!
        </Text>

        <Text className="mx-auto mb-6 mt-1 text-left text-base text-slate-400">
          "{documentName}" ha sido eliminado por un administrador.
        </Text>

        <Text className="mx-auto mb-6 mt-1 text-left text-base text-slate-400">
          Este documento no se puede recuperar. Si deseas disputar la razón para futuros documentos,
          por favor contacta al soporte.
        </Text>

        <Text className="mx-auto mt-1 text-left text-base text-slate-400">
          La razón proporcionada para la eliminación es la siguiente:
        </Text>

        <Text className="mx-auto mb-6 mt-1 text-left text-base italic text-slate-400">
          {reason}
        </Text>
      </Section>
    </>
  );
};

export default TemplateDocumentDelete;
