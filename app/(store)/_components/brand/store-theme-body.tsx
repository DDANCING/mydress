"use client";

import { useEffect } from "react";
import { storeFontVariables } from "./fonts";

// Modais, menus e toasts são renderizados direto no <body>, fora do layout da loja.
// Aplicamos o tema da loja no body enquanto a loja estiver aberta.
export const StoreThemeBody = () => {
  useEffect(() => {
    const classes = ["theme-store", ...storeFontVariables.split(" ")];
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, []);

  return null;
};
