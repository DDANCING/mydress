"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { SearchIcon, X } from "lucide-react"

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command"

import { getGlobalSearchResults, type SearchResults } from "@/actions/search"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect, useState, useTransition } from "react"
import { Skeleton } from "./skeleton"

export function GlobalSearch() {
  const router = useRouter()
  const [input, setInput] = React.useState("")
  const debouncedInput = useDebounce(input, 300)
  const [isPending, startTransition] = useTransition()

  const [results, setResults] = React.useState<SearchResults>({
    products: [],
    categories: [],
    colors: [],
    sizes: [],
  })

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
  startTransition(() => {
    if (debouncedInput.trim() === "") {
      setResults({ products: [], categories: [], colors: [], sizes: [] })
      return
    }

  
    ;(async () => {
      const res = await getGlobalSearchResults(debouncedInput)
      setResults(res)
    })()
  })
}, [debouncedInput])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      router.push(`/search/${encodeURIComponent(input.trim())}`)
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Desktop (md+) */}
      <form
        onSubmit={handleSubmit}
        className="hidden md:block w-full max-w-sm fixed "
      >
        <Command className="rounded-xl border shadow-md bg-background/60  w-96">
          <div className="relative text-foreground">
            <CommandInput
              placeholder="Buscar produtos, categorias..."
              value={input}
              onValueChange={setInput}
              className="pl-8"
            />
          </div>

          <CommandList className={cn(!input && "hidden")}>
            {isPending ? (
              <div>
              <div className="space-y-2 m-2">
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
                <Skeleton className="h-4" />
              </div>
             </div> 
            ):(
             <>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
             </> 
            )}
            

            {results.products.length > 0 && (
              <CommandGroup heading="Produtos">
                {results.products.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => {
                      router.push(`/product/${product.id}`)
                      setInput("")
                    }}
                  >
                    {product.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.categories.length > 0 && (
              <CommandGroup heading="Categorias">
                {results.categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    onSelect={() => {
                      router.push(`/category/${category.id}`)
                      setInput("")
                    }}
                  >
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.colors.length > 0 && (
              <CommandGroup heading="Cores">
                {results.colors.map((color) => (
                  <CommandItem
                    key={color.id}
                    onSelect={() => {
                      router.push(`/color/${color.id}`)
                      setInput("")
                    }}
                  >
                    {color.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.sizes.length > 0 && (
              <CommandGroup heading="Tamanhos">
                {results.sizes.map((size) => (
                  <CommandItem
                    key={size.id}
                    onSelect={() => {
                      router.push(`/size/${size.id}`)
                      setInput("")
                    }}
                  >
                    {size.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </form>

      {/* Mobile (até md) - Ícone de busca */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden flex w-12 h-12 -mt-4"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir busca"
      >
        <SearchIcon className="h-6 w-6" />
      </Button>

      {/* Mobile Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative w-full max-w-md rounded-lg bg-popover p-4 shadow-lg">
              {/* Botão de fechar */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar busca"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Campo de busca */}
              <form onSubmit={handleSubmit}>
                <Command className="border-none shadow-none">
                  <CommandInput
                    placeholder="Buscar produtos, categorias..."
                    value={input}
                    onValueChange={setInput}
                    className="pl-8"
                  />

                  <CommandList className={cn(!input && "hidden")}>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

                    {results.products.length > 0 && (
                      <CommandGroup heading="Produtos">
                        {results.products.map((product) => (
                          <CommandItem
                            key={product.id}
                            onSelect={() => {
                              router.push(`/product/${product.id}`)
                              setInput("")
                              setIsOpen(false)
                            }}
                          >
                            {product.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {results.categories.length > 0 && (
                      <CommandGroup heading="Categorias">
                        {results.categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => {
                              router.push(`/category/${category.id}`)
                              setInput("")
                              setIsOpen(false)
                            }}
                          >
                            {category.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {results.colors.length > 0 && (
                      <CommandGroup heading="Cores">
                        {results.colors.map((color) => (
                          <CommandItem
                            key={color.id}
                            onSelect={() => {
                              router.push(`/color/${color.id}`)
                              setInput("")
                              setIsOpen(false)
                            }}
                          >
                            {color.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {results.sizes.length > 0 && (
                      <CommandGroup heading="Tamanhos">
                        {results.sizes.map((size) => (
                          <CommandItem
                            key={size.id}
                            onSelect={() => {
                              router.push(`/size/${size.id}`)
                              setInput("")
                              setIsOpen(false)
                            }}
                          >
                            {size.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
