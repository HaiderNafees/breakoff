import Head from 'next/head';

type Props = {
  title: string;
  description: string;
  path?: string;
  image?: string;
};

const SITE = 'BreakOff';

export default function Seo({ title, description, path = '/', image }: Props) {
  const fullTitle = title.includes(SITE) ? title : `${title} — ${SITE}`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <link rel="canonical" href={path} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      {image ? <meta property="og:image" content={image} /> : null}
    </Head>
  );
}
