export function highlightMatch(text: string, query: string) {
  const regex = new RegExp(`(${query})`, "gi")
  const parts = text.split(regex)
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? <strong key={index}>{part}</strong> : part
  )
}