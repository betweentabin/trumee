"use client"

import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

interface CookieContextType {
  cookie: string
  user: any
  role?: string
  saveCookie: (_value: string) => Promise<void>
  deleteCookie: () => Promise<void>
}

export const CookieContext = createContext<CookieContextType | null>(null);


export const useCookies = (): CookieContextType => {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
};


export const CookieProvider = ({ children, getCookie, saveCookie, deleteCookie }: PropsWithChildren<{
  getCookie: () => Promise<string | undefined>,
  saveCookie: (_value: string) => Promise<void>,
  deleteCookie: () => Promise<void>,
}>) => {
  const [cookie, setCookie] = useState<string>();

  useEffect(() => {
    async function fetchCookie () {
        const cookieValue = await getCookie();
        setCookie(cookieValue);
    }

    fetchCookie();
  }, [getCookie])

  return (
    <CookieContext.Provider value={{ cookie, user: cookie ? JSON.parse(cookie) : null, role: cookie ? JSON.parse(cookie).role : undefined,  saveCookie, deleteCookie } as CookieContextType}>
      {children}
    </CookieContext.Provider>
  );
};