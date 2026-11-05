import '../styles/globals.css';
import Layout from '../components/Layout';
import SiteContext from '../components/SiteContext';

export default function App({ Component, pageProps }) {
  const site = {
    viewer: pageProps.viewer || null,
    siteUrl: pageProps.siteUrl || '',
  };
  return (
    <SiteContext.Provider value={site}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SiteContext.Provider>
  );
}
