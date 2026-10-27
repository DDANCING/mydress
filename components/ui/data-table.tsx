"use client"

import React, { useState } from "react"

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // accept a single key or multiple keys
  searchKey: string | string[] | Record<string, string>
  placeholder: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  placeholder,
  searchKey,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  )

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [searchTerm, setSearchTerm] = useState<string>("")

  // normalize search keys
  const searchKeysArr: string[] = React.useMemo(() => {
    if (typeof searchKey === "string") return [searchKey]
    if (Array.isArray(searchKey)) return searchKey
    if (searchKey && typeof searchKey === "object") return Object.keys(searchKey)
    return []
  }, [searchKey])

  // safe getter for nested keys like "buyer.name"
  const getByPath = (obj: any, path: string) => {
    try {
      return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
    } catch {
      return undefined
    }
  }

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data
    const term = searchTerm.toLowerCase()
    return (data as any[]).filter((row) =>
      searchKeysArr.some((k) => {
        const v = getByPath(row, k)
        if (v === null || v === undefined) return false
        return String(v).toLowerCase().includes(term)
      })
    )
  }, [data, searchTerm, searchKeysArr])
  const table = useReactTable({
    data: filteredData as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  state: {
      sorting,
      columnFilters,
    },
  })


  return (
<div>
    <div className="flex items-center py-4">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-sm"
        />
      </div>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Sem resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
         Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
         Próxima
        </Button>
      </div>
    </div>
  )
}