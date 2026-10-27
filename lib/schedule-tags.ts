export interface ScheduleTag {
  tag: string
  color: string
}

export const SCHEDULE_TAGS: ScheduleTag[] = [
   { tag: "retirada 📦", color: "blue" },
  { tag: "1º atendimento 💬", color: "red" },
  { tag: "ver 👀", color: "green" },
  { tag: "noiva 👰", color: "gray" },
  { tag: "prova 👗", color: "purple" },
  { tag: "daminha 🌸", color: "plum" },
  { tag: "formanda 🎓", color: "brown" },
  { tag: "madrinha 💐", color: "indigo" },
  { tag: "miss 👑", color: "gold" },
  { tag: "medidas 📏", color: "orange" },
  { tag: "convidada 💃", color: "salmon" },
  { tag: "não veio ❌", color: "teal" },
  { tag: "veio ✅", color: "emerald" },
  { tag: "mae 🤱", color: "pink" },
  { tag: "debutante 🩰", color: "skyblue" },
  { tag: "cerimonialista 📝", color: "coral" },
  { tag: "tirar medidas 📐", color: "lightgreen" },
  { tag: "condicional 🔄", color: "lightblue" },
  { tag: "outlet 🛍️", color: "darkorange" },
  { tag: "confecção 🧵", color: "chocolate" },
  { tag: "marca de moda 🧥", color: "crimson" },
  { tag: "Daminha 🌼", color: "orchid" },
  { tag: "Mãe de noiva 👩‍🦳", color: "lavender" },
  { tag: "fechar 🔒", color: "darkslategray" },
  { tag: "vem ver um vestido que já provou antes 👗👀", color: "lightgray" },
  { tag: "contrato 📄", color: "violet" },
  { tag: "mandar fazer 🧶", color: "goldenrod" },
  { tag: "aniversário 🎉", color: "silver" },
  { tag: "entrega 📦", color: "green" },
  { tag: "devolução 📦", color: "red" },
  { tag: "reunião 📅", color: "blueviolet" },
  { tag: "evento especial 🎊", color: "darkseagreen" },
  { tag: "consultoria 👔", color: "lightcoral" },
  { tag: "personal shopper 🛒", color: "mediumorchid" },
  { tag: "outro 📝", color: "lightsteelblue" },
  { tag: "enviar! 📦", color: "green" },
  { tag: "devolução! 📦", color: "red" },
  { tag: "site 🛜", color: "red" },
]

export function getTagColor(tagName: string): string {
  const tag = SCHEDULE_TAGS.find(t => t.tag === tagName)
  return tag?.color || "gray"
}
