import { Link, Section, Text } from '../components';

export type TemplateFooterProps = {
  isDocument?: boolean;
};

export const TemplateFooter = ({ isDocument = true }: TemplateFooterProps) => {
  return (
    <Section>
      {isDocument && (
        <Text className="my-4 text-base text-slate-400">
          Este documento fue enviado por{' '}
          <Link className="text-[#F6BE00]" href="https://pulppo.com">
            Pulppo.
          </Link>
        </Text>
      )}

      <Text className="my-8 text-sm text-slate-400">
        Pulppo Propiedades S. de C.V. de R.L.
        <br />
        Galileo 245 local 3, Polanco, Miguel Hidalgo, CDMX
      </Text>
    </Section>
  );
};

export default TemplateFooter;
