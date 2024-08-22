import { RECIPIENT_ROLES_DESCRIPTION } from '@documenso/lib/constants/recipient-roles';
import type { RecipientRole } from '@documenso/prisma/client';

import { Button, Section, Text } from '../components';
import { TemplateDocumentImage } from './template-document-image';

export interface TemplateDocumentInviteProps {
  inviterName: string;
  inviterEmail: string;
  documentName: string;
  signDocumentLink: string;
  assetBaseUrl: string;
  role: RecipientRole;
  selfSigner: boolean;
  isTeamInvite: boolean;
  teamName?: string;
}

export const TemplateDocumentInvite = ({
  inviterName,
  documentName,
  signDocumentLink,
  assetBaseUrl,
  role,
  selfSigner,
  isTeamInvite,
  teamName,
}: TemplateDocumentInviteProps) => {
  const { actionVerb, progressiveVerb } = RECIPIENT_ROLES_DESCRIPTION[role];

  return (
    <>
      <TemplateDocumentImage className="mt-6" assetBaseUrl={assetBaseUrl} />

      <Section>
        <Text className="text-primary mx-auto mb-0 max-w-[80%] text-center text-lg font-semibold">
          {selfSigner ? (
            <>
              {`Por favor ${actionVerb.toLowerCase()} tu documento`}
              <br />
              {`"${documentName}"`}
            </>
          ) : isTeamInvite ? (
            <>
              {`${inviterName} en representación de ${teamName} te ha invitado a${actionVerb.toLowerCase()}`}
              <br />
              {`"${documentName}"`}
            </>
          ) : (
            <>
              {`${inviterName} te ha invitado a ${actionVerb.toLowerCase()}`}
              <br />
              {`"${documentName}"`}
            </>
          )}
        </Text>

        <Text className="my-1 text-center text-base text-slate-400">
         Continuar {progressiveVerb.toLowerCase()} el documento.
        </Text>

        <Section className="mb-6 mt-8 text-center">
          <Button
            className="bg-documenso-500 inline-flex items-center justify-center rounded-lg px-6 py-3 text-center text-sm font-medium text-black no-underline"
            href={signDocumentLink}
          >
            {actionVerb} el documento
          </Button>
        </Section>
      </Section>
    </>
  );
};

export default TemplateDocumentInvite;
