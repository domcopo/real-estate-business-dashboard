"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ZoomIn, ZoomOut, Grid, Save, Loader2 } from "lucide-react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
} from "@dnd-kit/core"
import { useUser } from "@clerk/nextjs"

interface Blop {
  id: string
  x: number
  y: number
  shape: "circle" | "square" | "pill" | "diamond"
  color: string
  content: string
  type: "text" | "link" | "url" | "file" | "image" | "embed"
}

const initialBlops: Blop[] = [
  {
    id: "1",
    x: 100,
    y: 100,
    shape: "circle",
    color: "bg-blue-500",
    content: "Welcome Blop",
    type: "text",
  },
]

export default function FlexboardPage() {
  const { user } = useUser()
  const [blops, setBlops] = useState<Blop[]>(initialBlops)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const lastTouchDistance = useRef<number | null>(null)
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Load blops from database on mount
  useEffect(() => {
    async function loadBlops() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/blops')
        if (response.ok) {
          const data = await response.json()
          if (data.blops && data.blops.length > 0) {
            // Convert database format to component format
            const loadedBlops: Blop[] = data.blops.map((b: any) => ({
              id: b.id,
              x: b.x,
              y: b.y,
              shape: b.shape,
              color: b.color,
              content: b.content,
              type: b.type,
            }))
            setBlops(loadedBlops)
          }
        }
      } catch (error) {
        console.error('Failed to load blops:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBlops()
  }, [user])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event
    setBlops((blops) =>
      blops.map((blop) =>
        blop.id === active.id
          ? { ...blop, x: blop.x + delta.x / zoom, y: blop.y + delta.y / zoom }
          : blop
      )
    )
    // Auto-save will trigger via useEffect
  }

  const saveBlops = async (showAlert = false) => {
    if (!user) {
      if (showAlert) alert('Please sign in to save')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/blops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blops: blops,
          workspaceId: null, // You can get this from Clerk organization if needed
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setLastSaved(new Date())
        if (showAlert) {
          alert(`Saved ${data.blops?.length || blops.length} blops successfully!`)
        }
      } else {
        const error = await response.json()
        if (showAlert) {
          alert(`Failed to save: ${error.error || 'Unknown error'}`)
        }
        console.error('Save error:', error)
      }
    } catch (error) {
      console.error('Error saving blops:', error)
      if (showAlert) {
        alert('Failed to save blops. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Auto-save after changes (debounced)
  useEffect(() => {
    if (!user || loading) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveBlops(false) // Auto-save without alert
    }, 1000) // Wait 1 second after last change

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blops, user, loading])

  const addBlop = () => {
    const newBlop: Blop = {
      id: Date.now().toString(),
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
      shape: "circle",
      color: "bg-blue-500",
      content: "New Blop",
      type: "text",
    }
    setBlops([...blops, newBlop])
    // Auto-save will trigger via useEffect
  }

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1) {
      // Pan gesture
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch to zoom
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      )
      
      const scale = distance / lastTouchDistance.current
      setZoom((prevZoom) => Math.max(0.5, Math.min(3, prevZoom * scale)))
      lastTouchDistance.current = distance
    } else if (e.touches.length === 1 && lastPanPoint.current) {
      // Pan
      const deltaX = e.touches[0].clientX - lastPanPoint.current.x
      const deltaY = e.touches[0].clientY - lastPanPoint.current.y
      
      setPan((prevPan) => ({
        x: prevPan.x + deltaX,
        y: prevPan.y + deltaY,
      }))
      
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  const handleTouchEnd = () => {
    lastTouchDistance.current = null
    lastPanPoint.current = null
  }

  // Reset pan and zoom
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Flexboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Drag and organize your blops
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={resetView}
            className="h-8 w-8 sm:h-10 sm:w-10"
            title="Reset view"
          >
            <span className="text-xs sm:text-sm">1:1</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => saveBlops(true)}
            disabled={saving || !user}
            className="h-8 w-8 sm:h-10 sm:w-10"
            title={!user ? "Sign in to save" : lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "Save blops to database"}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
          {lastSaved && !saving && (
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={addBlop} className="h-8 sm:h-10 text-xs sm:text-sm">
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Add Blop</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 overflow-hidden relative bg-muted/30 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <div
              className="relative w-full h-full min-h-[800px]"
              style={{
                backgroundImage: showGrid
                  ? "radial-gradient(circle, #e5e7eb 1px, transparent 1px)"
                  : "none",
                backgroundSize: `${20 / zoom}px ${20 / zoom}px`,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "top left",
                touchAction: "none",
              }}
            >
              {blops.map((blop) => (
                <BlopComponent key={blop.id} blop={blop} />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </div>
  )
}

function BlopComponent({ blop }: { blop: Blop }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: blop.id,
  })

  const style = {
    position: "absolute" as const,
    left: blop.x + (transform?.x ?? 0),
    top: blop.y + (transform?.y ?? 0),
    opacity: isDragging ? 0.5 : 1,
  }

  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-lg",
    pill: "rounded-full px-8",
    diamond: "rotate-45",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${blop.color} ${shapeClasses[blop.shape]} w-24 h-24 flex items-center justify-center text-white font-medium cursor-move shadow-lg hover:shadow-xl transition-shadow`}
    >
      <div className={blop.shape === "diamond" ? "rotate-[-45deg]" : ""}>
        {blop.content}
      </div>
    </div>
  )
}

