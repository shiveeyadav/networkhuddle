import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSite } from './SiteContext';
import { SITE_NAME } from '../lib/constants';

const DEFAULT_DESCRIPTION =
  'NetworkHuddle is a UK business networking membership. Meet business owners online and face to face, swap referrals and book 1-1s.';

export default function Seo({ title, description, noindex = false, path }) {
  const { siteUrl } = useSite();
  const router = useRouter();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - UK business networking, online and face to face`;
  const desc = description || DEFAULT_DESCRIPTION;
  const cleanPath = (path || (router.asPath || '/').split(/[?#]/)[0]) || '/';
  const canonical = siteUrl ? `${siteUrl}${cleanPath === '/' ? '' : cleanPath}` : null;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
      {canonical && !noindex ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      <meta name="twitter:card" content="summary" />
    </Head>
  );
}
