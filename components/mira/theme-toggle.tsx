"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Subtle icon-only toggle that flips between light and dark.
 * Renders a stable placeholder on the server / before hydration to
 * avoid the next-themes mismatch warning, then swaps in the live icon.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"
  const nextLabel = isDark ? "Activar tema claro" : "Activar tema oscuro"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={nextLabel}
      title={nextLabel}
      className="size-8 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Render both icons and toggle visibility once mounted: stable SSR markup. */}
      <Sun
        className={
          mounted && isDark
            ? "size-4 scale-0 opacity-0 transition-all"
            : "size-4 scale-100 opacity-100 transition-all"
        }
        aria-hidden="true"
      />
      <Moon
        className={
          mounted && isDark
            ? "absolute size-4 scale-100 opacity-100 transition-all"
            : "absolute size-4 scale-0 opacity-0 transition-all"
        }
        aria-hidden="true"
      />
    </Button>
  )
}
