"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useState } from "react"

interface ResponsiveResizableLayoutProps {
  children: React.ReactNode
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
}

export function ResponsiveResizableLayout({ 
  children, 
  leftPanel, 
  rightPanel 
}: ResponsiveResizableLayoutProps) {
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [sizes, setSizes] = useState([50, 50])

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // Tailwind 'lg' = 1024px
    }

    // Carregar tamanhos salvos do localStorage
    const savedSizes = localStorage.getItem('dashboard-horizontal-sizes')
    if (savedSizes) {
      setSizes(JSON.parse(savedSizes))
    }

    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  const handleSizeChange = (newSizes: number[]) => {
    setSizes(newSizes)
    localStorage.setItem('dashboard-horizontal-sizes', JSON.stringify(newSizes))
  }

  if (!isLargeScreen) {
    return <>{children}</>
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full border rounded-lg"
      onLayout={handleSizeChange}
    >
      <ResizablePanel defaultSize={sizes[0]} minSize={30}>
        <div className="h-full p-1">
          {leftPanel}
        </div>
      </ResizablePanel>
      <ResizableHandle className="w-2 bg-border hover:bg-accent" />
      <ResizablePanel defaultSize={sizes[1]} minSize={30}>
        <div className="h-full p-1">
          {rightPanel}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

interface ResponsiveTripleLayoutProps {
  children: React.ReactNode
  panel1: React.ReactNode
  panel2: React.ReactNode
  panel3: React.ReactNode
}

export function ResponsiveTripleLayout({ 
  children, 
  panel1, 
  panel2, 
  panel3 
}: ResponsiveTripleLayoutProps) {
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [sizes, setSizes] = useState([33, 33, 34])

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // Tailwind 'lg' = 1024px
    }

    // Carregar tamanhos salvos do localStorage
    const savedSizes = localStorage.getItem('dashboard-triple-sizes')
    if (savedSizes) {
      setSizes(JSON.parse(savedSizes))
    }

    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  const handleSizeChange = (newSizes: number[]) => {
    setSizes(newSizes)
    localStorage.setItem('dashboard-triple-sizes', JSON.stringify(newSizes))
  }

  if (!isLargeScreen) {
    return <>{children}</>
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full border rounded-lg"
      onLayout={handleSizeChange}
    >
      <ResizablePanel defaultSize={sizes[0]} minSize={25}>
        <div className="h-full p-1">
          {panel1}
        </div>
      </ResizablePanel>
      <ResizableHandle className="w-2 bg-border hover:bg-accent" />
      <ResizablePanel defaultSize={sizes[1]} minSize={25}>
        <div className="h-full p-1">
          {panel2}
        </div>
      </ResizablePanel>
      <ResizableHandle className="w-2 bg-border hover:bg-accent" />
      <ResizablePanel defaultSize={sizes[2]} minSize={25}>
        <div className="h-full p-1">
          {panel3}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

interface ResponsiveVerticalLayoutProps {
  children: React.ReactNode
  row1: React.ReactNode
  row2: React.ReactNode
  row3: React.ReactNode
}

export function ResponsiveVerticalLayout({ 
  children, 
  row1, 
  row2, 
  row3 
}: ResponsiveVerticalLayoutProps) {
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const [sizes, setSizes] = useState([33, 33, 34])

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(window.innerWidth >= 1024) // Tailwind 'lg' = 1024px
    }

    // Carregar tamanhos salvos do localStorage
    const savedSizes = localStorage.getItem('dashboard-vertical-sizes')
    if (savedSizes) {
      setSizes(JSON.parse(savedSizes))
    }

    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  const handleSizeChange = (newSizes: number[]) => {
    setSizes(newSizes)
    localStorage.setItem('dashboard-vertical-sizes', JSON.stringify(newSizes))
  }

  if (!isLargeScreen) {
    return <>{children}</>
  }

  return (
    <div className="h-full overflow-y-auto">
      <ResizablePanelGroup
        direction="vertical"
        className="min-h-screen w-full"
        onLayout={handleSizeChange}
      >
        <ResizablePanel defaultSize={sizes[0]} minSize={20}>
          <div className="h-full w-full">
            {row1}
          </div>
        </ResizablePanel>
        <ResizableHandle className="h-2 bg-border hover:bg-accent" />
        <ResizablePanel defaultSize={sizes[1]} minSize={20}>
          <div className="h-full w-full">
            {row2}
          </div>
        </ResizablePanel>
        <ResizableHandle className="h-2 bg-border hover:bg-accent" />
        <ResizablePanel defaultSize={sizes[2]} minSize={20}>
          <div className="h-full w-full">
            {row3}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
