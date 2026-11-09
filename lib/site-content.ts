import photoSizes from "./site-photos.json";

// Conteúdo do site institucional. Para adicionar um vestido, inclua a foto em public/site,
// registre o tamanho em site-photos.json e acrescente um item em `looks`:
// ele aparece sozinho no acervo e nas páginas das ocasiões marcadas.

export type Photo = { src: string; alt: string; width: number; height: number };

const photo = (name: string, alt: string): Photo => {
  const size = (photoSizes as Record<string, number[]>)[name];
  // Foto digitada errado quebra o build em vez de virar imagem quebrada no site
  if (!size) throw new Error(`Foto não encontrada em public/site: ${name}`);
  return { src: `/site/${name}.webp`, alt, width: size[0], height: size[1] };
};

export type OccasionSlug =
  | "madrinhas"
  | "formandas"
  | "convidadas"
  | "casamento-civil"
  | "pre-wedding"
  | "cha-revelacao";

export type Occasion = {
  slug: OccasionSlug;
  name: string;
  summary: string;
  title: string;
  text: string;
  cta: string;
  message: string;
  cover: Photo;
  photos: Photo[];
};

export const occasions: Occasion[] = [
  {
    slug: "madrinhas",
    name: "Madrinhas",
    summary: "O grupo inteiro combinando, nas cores do casamento.",
    title: "O grupo inteiro combinando.",
    text: "Vestidos em cores que conversam entre si, para todas as madrinhas do mesmo casamento. Reservamos os modelos e os tamanhos de cada uma para a data.",
    cta: "Reservar para as madrinhas",
    message: "Olá! Gostaria de ver os vestidos para madrinhas.",
    cover: photo("mad-2", "Noiva e madrinhas de vestidos terracota reunidas no provador da My Dress"),
    photos: [
      photo("mad-1", "Noiva e madrinhas de verde-água e lilás brindando no provador"),
      photo("mad-3", "Três madrinhas de rosa, verde e coral diante de um arco de flores na praia"),
      photo("mad-4", "Duas madrinhas de azul-turquesa em um deck à beira-mar"),
      photo("mad-5", "Madrinhas de vinho segurando buquês em um jardim"),
      photo("mad-6", "Noiva entre madrinhas de cores vibrantes sob um arco de flores"),
      photo("mad-7", "Noiva e madrinhas de verde-água em uma cerimônia ao ar livre"),
    ],
  },
  {
    slug: "formandas",
    name: "Formandas",
    summary: "Brilho, tule e fenda para a colação e o baile.",
    title: "A noite que você esperou.",
    text: "Tule com brilho, cetim e fenda para a colação de grau e o baile, com opções para trocar de vestido entre as duas festas.",
    cta: "Quero provar para a formatura",
    message: "Olá! Gostaria de ver os vestidos para formandas.",
    cover: photo("preto-tule-frente", "Vestido preto em tule com decote V profundo"),
    photos: [],
  },
  {
    slug: "convidadas",
    name: "Convidadas",
    summary: "Elegância para casamentos, jantares e festas.",
    title: "Elegância sem esforço.",
    text: "Modelos para estar impecável em casamentos, jantares e festas, respeitando o dress code de cada convite.",
    cta: "Quero provar como convidada",
    message: "Olá! Gostaria de ver os vestidos para convidadas.",
    cover: photo("terracota-ombro-frente", "Vestido terracota de ombro único com gargantilha de cristais"),
    photos: [],
  },
  {
    slug: "casamento-civil",
    name: "Casamento civil",
    summary: "Curtos, midi e longos em tons de branco.",
    title: "Para o dia do sim no papel.",
    text: "Vestidos curtos, midi e longos em tons de branco, pensados para o cartório, cerimônias pequenas e recepções ao ar livre.",
    cta: "Quero provar para o civil",
    message: "Olá! Gostaria de ver os vestidos para casamento civil.",
    cover: photo("civ-8", "Noiva de vestido branco midi com alças de laço, segurando um buquê"),
    photos: [
      photo("civ-11", "Noiva de longo branco sentada entre flores"),
      photo("civ-10", "Noiva de vestido branco de renda em um balanço de vime"),
      photo("civ-9", "Vestido branco com laços nas costas, visto de trás"),
      photo("civ-6", "Noiva de longo branco com mangas de renda em um mirante"),
      photo("civ-7", "Vestido branco com decote nas costas, junto a uma janela"),
      photo("civ-1", "Casal sorrindo, noiva de vestido acetinado branco"),
      photo("civ-3", "Casal em frente a uma porta antiga, noiva de vestido nude"),
      photo("civ-4", "Casal de branco e bege caminhando de mãos dadas junto a um arco de flores"),
      photo("civ-5", "Casal ao entardecer, noiva de vestido branco de mangas longas"),
      photo("civ-2", "Casal diante da Torre Eiffel, noiva de vestido branco"),
    ],
  },
  {
    slug: "pre-wedding",
    name: "Pré wedding",
    summary: "Movimento e renda para o ensaio.",
    title: "Antes da festa, o ensaio.",
    text: "Vestidos com movimento e renda para ensaios na praia, no campo e no fim da tarde, feitos para as fotos.",
    cta: "Quero um vestido para o ensaio",
    message: "Olá! Gostaria de ver os vestidos para pré wedding.",
    cover: photo("cas-2", "Casal caminhando ao pôr do sol, noiva de longo branco com decote V"),
    photos: [
      photo("cas-10", "Casal se beijando na beira da praia, noiva de vestido esvoaçante"),
      photo("cas-1", "Casal na areia ao pôr do sol, vestido de cauda longa"),
      photo("cas-3", "Casal junto a uma tenda na praia, vestido de renda"),
      photo("cas-5", "Casal entre pedras, noiva de branco com buquê"),
      photo("cas-6", "Casal à beira-mar, com a ponte de Florianópolis ao fundo"),
      photo("cas-7", "Casal de branco e bege caminhando junto a um arco de flores"),
      photo("cas-8", "Casal abraçado sob um arco de madeira e flores"),
      photo("cas-9", "Casal de mãos dadas na areia ao pôr do sol"),
      photo("cas-4", "Noiva de vestido branco abraçada ao noivo, segurando o buquê"),
    ],
  },
  {
    slug: "cha-revelacao",
    name: "Chá revelação",
    summary: "Conforto e caimento que valoriza a barriga.",
    title: "Azul ou rosa?",
    text: "Vestidos leves, com caimento que valoriza a barriga nas fotos, para a mãe, a madrinha e as convidadas do chá revelação.",
    cta: "Quero provar para o chá",
    message: "Olá! Gostaria de ver os vestidos para chá revelação.",
    cover: photo("cha-2", "Casal no chá revelação, gestante de longo rosé com mangas longas"),
    photos: [
      photo("cha-1", "Gestante de vestido floral azul junto à mesa do chá"),
      photo("cha-3", "Casal em frente ao painel Boy or Girl, gestante de vestido floral rosa"),
      photo("cha-4", "Gestante de vestido floral verde ao lado do painel Menino ou Menina"),
      photo("cha-5", "Gestante de vestido rosé diante de um painel de balões"),
    ],
  },
];

export const getOccasion = (slug: string) => occasions.find((occasion) => occasion.slug === slug);

export const colors = [
  { slug: "preto", name: "Preto", swatch: "#17120f" },
  { slug: "azul", name: "Azuis", swatch: "#2a4f9e" },
  { slug: "verde", name: "Verdes", swatch: "#1f7a64" },
  { slug: "rosa", name: "Rosas e fúcsia", swatch: "#c2257b" },
  { slug: "vermelho", name: "Vermelhos e coral", swatch: "#c9402e" },
  { slug: "terroso", name: "Terrosos", swatch: "#a0694a" },
  { slug: "prata", name: "Pratas e cinzas", swatch: "#a9acb0" },
] as const;

export type ColorSlug = (typeof colors)[number]["slug"];

export type Look = {
  id: string;
  name: string;
  detail: string;
  color: ColorSlug;
  occasions: OccasionSlug[];
  photo: Photo;
  back?: Photo;
  exclusive?: boolean;
};

const look = (
  id: string,
  name: string,
  detail: string,
  color: ColorSlug,
  lookOccasions: OccasionSlug[],
  backId?: string,
  exclusive?: boolean,
): Look => ({
  id,
  name,
  detail,
  color,
  occasions: lookOccasions,
  photo: photo(id, `${name}: ${detail.toLowerCase()}`),
  back: backId ? photo(backId, `${name}, visto de costas`) : undefined,
  exclusive,
});

// Bordados exclusivos: capas dos reels da coleção (360x640). shortcut: resolução baixa, trocar pelas fotos originais do ensaio.
export const crisLooks: Look[] = [
  look("cris-01", "Prata bordado com franjas", "Corpete estruturado, pedrarias e franjas de cristais", "prata", ["formandas"], undefined, true),
  look("cris-02", "Prata bordado com fenda", "Recortes na cintura, fenda alta e saia de franjas", "prata", ["formandas"], undefined, true),
  look("cris-03", "Nude bordado com peplum", "Transparência bordada e peplum de cristais", "prata", ["formandas"], undefined, true),
  look("cris-04", "Fúcsia bordado", "Decote ilusão e pedraria em toda a modelagem", "rosa", ["formandas"], undefined, true),
  look("cris-05", "Esmeralda bordado com fenda", "Decote profundo, paetês e fenda lateral", "verde", ["formandas"], undefined, true),
  look("cris-06", "Lilás acetinado com cristais", "Cetim estruturado e decote coração bordado", "prata", ["formandas"], undefined, true),
];

export const looks: Look[] = [
  ...crisLooks,
  look("camelo-capa-frente", "Caramelo com capa e corset", "Sereia em malha com capa longa e broche de cristais", "terroso", ["convidadas", "formandas"], "camelo-capa-costas"),
  look("terracota-ombro-frente", "Terracota ombro único com capa", "Gargantilha de cristais e capa drapeada nas costas", "terroso", ["convidadas"], "terracota-ombro-costas"),
  look("chocolate-plissado-frente", "Chocolate plissado", "Saia plissada e sobreposição de chiffon em capa", "terroso", ["convidadas", "madrinhas"], "chocolate-plissado-costas"),
  look("preto-fenda-frente", "Preto acetinado com fenda", "Alças finas, cetim fluido e fenda lateral alta", "preto", ["formandas", "convidadas"]),
  look("preto-ombro-manga-frente", "Preto ombro único com manga", "Nó na cintura, manga fendida e fenda lateral", "preto", ["convidadas"], "preto-ombro-manga-costas"),
  look("preto-tule-frente", "Preto em tule com brilho", "Decote V profundo e saia em camadas", "preto", ["formandas"], "preto-tule-costas"),
  look("prata-sereia-fenda", "Prata acetinado com fenda", "Sereia em cetim drapeado e fenda lateral alta", "prata", ["formandas", "convidadas"], "prata-sereia-costas"),
  look("azul-tule-frente", "Azul claro em tule", "Tule com brilho, decote V e saia em camadas", "azul", ["formandas", "madrinhas"]),
  look("gal-01", "Pink acetinado com laço", "Laço no ombro e saia ampla com fenda", "rosa", ["formandas", "convidadas"]),
  look("gal-02", "Fúcsia acetinado", "Drapeado na cintura e fenda lateral", "rosa", ["formandas"]),
  look("gal-21", "Fúcsia fluido", "Tomara que caia com camadas assimétricas", "rosa", ["madrinhas", "convidadas"]),
  look("gal-03", "Petróleo com mangas de tule", "Ombro único, brilho e mangas longas esvoaçantes", "verde", ["madrinhas", "convidadas"]),
  look("gal-13", "Petróleo com babado no ombro", "Ombro único e saia com brilho sutil", "verde", ["madrinhas"]),
  look("gal-15", "Esmeralda ombro caído", "Sereia acetinada com fenda lateral", "verde", ["convidadas", "formandas"]),
  look("gal-19", "Verde-água com brilho", "Alças finas, decote coração e saia ampla", "verde", ["madrinhas"]),
  look("gal-22", "Menta com sobreposição", "Ombro único e saia aberta sobre a fenda", "verde", ["convidadas"]),
  look("gal-05", "Oliva drapeado", "Tomara que caia, drapeado e fenda frontal", "verde", ["convidadas"]),
  look("gal-06", "Azul royal plissado", "Saia plissada e sobreposição em capa", "azul", ["convidadas", "madrinhas"]),
  look("gal-09", "Azul royal com fenda", "Tomara que caia acetinado com fenda alta", "azul", ["formandas", "madrinhas"]),
  look("gal-25", "Azul royal ombro caído", "Corpete marcado, ombros à mostra e fenda", "azul", ["formandas"]),
  look("gal-10", "Marinho em camadas", "Tule em camadas, alças finas e fenda", "azul", ["formandas"]),
  look("gal-18", "Azul acetinado com corset", "Decote coração e saia ampla", "azul", ["formandas"]),
  look("gal-07", "Serenity com fenda", "Tomara que caia acetinado e fenda lateral", "azul", ["formandas", "madrinhas"]),
  look("gal-14", "Serenity fluido", "Tomara que caia com camadas assimétricas", "azul", ["madrinhas", "convidadas"]),
  look("gal-26", "Turquesa frente única", "Musseline em camadas e decote frente única", "azul", ["madrinhas"]),
  look("gal-16", "Vermelho com mangas volumosas", "Cetim encorpado, ombros marcados e cauda", "vermelho", ["formandas"]),
  look("gal-17", "Coral fluido", "Tomara que caia com camadas assimétricas", "vermelho", ["madrinhas"]),
  look("gal-20", "Preto em camadas", "Amarração lateral e saia de tule em camadas", "preto", ["formandas"]),
  look("gal-12", "Cinza com brilho", "Tomara que caia drapeado com echarpe", "prata", ["convidadas"]),
  look("gal-04", "Esmeralda com brilho", "Alças finas, decote V e saia ampla brilhante", "verde", ["formandas", "madrinhas"]),
  look("gal-08", "Petróleo acetinado", "Tomara que caia com drapeado e saia ampla", "azul", ["formandas", "convidadas"]),
  look("gal-11", "Vermelho drapeado", "Tomara que caia com corpete drapeado e saia fluida", "vermelho", ["madrinhas", "convidadas"]),
  look("gal-23", "Preto em tule com fenda", "Alças finas, saia em camadas e fenda alta", "preto", ["formandas"]),
  look("gal-24", "Verde-água acetinado", "Decote reto, alças finas e saia ampla", "verde", ["madrinhas", "formandas"]),
];

export const looksFor = (slug: OccasionSlug) => looks.filter((item) => item.occasions.includes(slug));

// Galeria "Novidades que chegaram": as fotos do acervo que vieram da galeria do site antigo
export const galleryPhotos = looks
  .filter((item) => item.id.startsWith("gal-"))
  .sort((a, b) => a.id.localeCompare(b.id))
  .map((item) => item.photo);

export const experiencePhotos = {
  salon: photo("exp-2", "Salão da My Dress, com araras de vestidos organizadas por cor"),
  coffee: photo("exp-1", "Xícara de café passado na hora servida na bandeja"),
  service: photo("exp-4", "Consultora atendendo uma cliente no balcão"),
  dog: photo("exp-3", "Spitz alaranjado de gravata borboleta, mascote da loja"),
  cake: photo("exp-5", "Bolo de chocolate na mesa de boas-vindas"),
  cart: photo("exp-6", "Carrinho de café com bolo e xícaras"),
  board: photo("exp-7", "Tábua de frios preparada para o Dia da Madrinha"),
};

export const team = {
  founder: photo("dani-fundadora", "Dani Scott Garcia, fundadora da My Dress"),
  consultant: photo("consultora", "Consultora da My Dress anotando na agenda"),
};

export const heroPhotos = {
  detail: photo("hero-camelo-detalhe", "Detalhe do corset e da capa do vestido caramelo"),
  body: photo("hero-camelo-corpo", "Modelo com vestido sereia caramelo de capa longa"),
};

export const backdrops = {
  blue: photo("azul-tule-frente-bg", ""),
  black: photo("preto-fenda-frente-bg", ""),
  terracotta: photo("terracota-ombro-frente-bg", ""),
  caramel: photo("camelo-capa-frente-bg", ""),
};

export const crisPortrait = photo("cris-dani", "Cris Mazzonetto e Dani Scott Garcia, de braços cruzados");

export const steps = [
  { title: "Você agenda", text: "Escolhe um horário pelo WhatsApp. O atendimento é individual." },
  { title: "A gente escuta", text: "Conta a ocasião, o dress code, o que você gosta e o que não gosta." },
  { title: "Você experimenta", text: "Separamos as opções ideais para você provar." },
  { title: "Você leva o seu", text: "Sai com o vestido escolhido e com a data do evento acertada." },
];

export const reviews = [
  "Se eu pudesse dar mais de 5 estrelas, daria sem pensar duas vezes! A My Dress Floripa superou todas as minhas expectativas. Desde o primeiro atendimento até a escolha final do vestido, tudo foi absolutamente impecável.",
  "Atendimento impecável. As meninas são uns amores e têm toda paciência para nos ajudar a escolher o vestido ideal. Meu vestido estava PERFEITO, parece que foi feito pra mim.",
  "A melhor experiência! Fui recebida com muito carinho e atenção. Minhas necessidades e desejos foram ouvidos quanto às expectativas do vestido para a ocasião.",
  "Experiência maravilhosa! O atendimento foi impecável do início ao fim, com muito cuidado, atenção e profissionalismo. O ambiente é requintado e acolhedor.",
];

export const experienceQuote = "Atendimento impecável do começo ao fim. Saí com o vestido dos meus sonhos e me senti única.";
export const founderQuote = "A Dani foi super atenciosa, me senti em um dia de princesa.";

export const googleReviewsUrl =
  "https://www.google.com/maps/search/?api=1&query=My+Dress+Floripa+Coqueiros+Florian%C3%B3polis";

export const directionsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=R.+Sen.+Milton+Campos%2C+265%2C+Coqueiros%2C+Florian%C3%B3polis%2C+SC";

export const mapEmbedUrl =
  "https://www.google.com/maps?q=R.%20Sen.%20Milton%20Campos%2C%20265%2C%20Coqueiros%2C%20Florian%C3%B3polis%2C%20SC%2C%2088080-110&output=embed";

export const openingHours = "Segunda a sábado, das 9h às 18h";
