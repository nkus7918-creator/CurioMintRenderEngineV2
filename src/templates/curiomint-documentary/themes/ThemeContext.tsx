import {
    createContext,
    useContext,
  } from "react";
  
  import {
    getDocumentaryTheme,
  } from "./index";
  
  import type {
    DocumentaryTheme,
    DocumentaryThemeId,
  } from "./types";
  
  const ThemeContext =
    createContext<DocumentaryTheme>(
      getDocumentaryTheme(
        "documentary-dark",
      ),
    );
  
  type ThemeProviderProps = {
    theme: DocumentaryThemeId;
    children: React.ReactNode;
  };
  
  export const ThemeProvider = ({
    theme,
    children,
  }: ThemeProviderProps) => {
    return (
      <ThemeContext.Provider
        value={getDocumentaryTheme(theme)}
      >
        {children}
      </ThemeContext.Provider>
    );
  };
  
  export const useTheme = () => {
    return useContext(ThemeContext);
  };