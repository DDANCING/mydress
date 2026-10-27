import Stripe from "stripe";

let client: Stripe | null = null;

// O cliente só é criado no primeiro uso. Criar no import fazia o `next build` falhar
// quando STRIPE_API_KEY não existia no ambiente de build.
const getStripe = () => {
  if (!client) {
    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_API_KEY não configurada. Defina a chave do Stripe nas variáveis de ambiente.");
    }
    client = new Stripe(apiKey, {
      apiVersion: "2025-04-30.basil",
      typescript: true,
    });
  }
  return client;
};

export const stripe = new Proxy({} as Stripe, {
  get: (_target, property) => Reflect.get(getStripe(), property),
});
