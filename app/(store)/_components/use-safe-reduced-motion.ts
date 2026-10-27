"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

// O useReducedMotion devolve null no servidor e já devolve true/false na primeira
// renderização do navegador. Isso gera atributos diferentes e quebra a hidratação.
// Aqui a preferência só é aplicada depois que o componente monta.
export const useSafeReducedMotion = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted && prefersReducedMotion === true;
};
