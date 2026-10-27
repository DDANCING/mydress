import { Resend } from "resend";

let client: Resend | null = null;

// O cliente só é criado no primeiro envio. Criar no import fazia o `next build` falhar
// quando RESEND_API_KEY não existia no ambiente de build.
const getResend = () => {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY não configurada. Defina a chave do Resend nas variáveis de ambiente.");
    }
    client = new Resend(apiKey);
  }
  return client;
};

export const resend = new Proxy({} as Resend, {
  get: (_target, property) => Reflect.get(getResend(), property),
});
