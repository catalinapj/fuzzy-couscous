import { createContext, useContext, useState } from "react";

const FooterContext = createContext(null);

export function FooterProvider({ children }) {
  const [footerContent, setFooterContent] = useState(null);

  return (
    <FooterContext.Provider value={{ footerContent, setFooterContent }}>
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  const context = useContext(FooterContext);
  if (!context) {
    throw new Error("useFooter must be used within FooterProvider");
  }
  return context;
}
