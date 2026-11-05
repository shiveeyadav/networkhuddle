import { createContext, useContext } from 'react';

const SiteContext = createContext({ viewer: null, siteUrl: '' });

export function useSite() {
  return useContext(SiteContext);
}

export default SiteContext;
