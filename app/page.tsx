"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { ChatPanel } from "@/components/mira/chat-panel"
import { IntakeForm } from "@/components/mira/intake-form"
import { TriageSidebar, type TriageState } from "@/components/mira/triage-sidebar"
import { Button } from "@/components/ui/button"
import { getProfile, type ChildProfile } from "@/lib/mira-storage"

const ACTIVE_CHILD_KEY = "mira_active_child"

const INITIAL_STATE: TriageState = {
  intake: false,
  mchat: false,
  risk: null,
  denver: false,
  video: false,
}

export default function Page() {
  const [child, setChild] = useState<ChildProfile | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [triage, setTriage] = useState<TriageState>(INITIAL_STATE)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Rehydrate the active profile on mount so a refresh keeps the user in
  // the chat instead of bouncing back to the intake form.
  useEffect(() => {
    try {
      const id = window.localStorage.getItem(ACTIVE_CHILD_KEY)
      if (id) {
        const existing = getProfile(id)
        if (existing) setChild(existing)
      }
    } catch {
      /* localStorage blocked — fall through to intake */
    }
    setHydrated(true)
  }, [])

  const handleStateChange = useCallback((s: TriageState) => setTriage(s), [])

  const handleIntakeComplete = useCallback((profile: ChildProfile) => {
    setChild(profile)
    try {
      window.localStorage.setItem(ACTIVE_CHILD_KEY, profile.id)
    } catch {
      /* non-fatal */
    }
    // Intake is done — mark that progress step as complete immediately.
    setTriage((prev) => ({ ...prev, intake: true }))
  }, [])

  // Avoid a flash of the intake form while we read localStorage.
  if (!hydrated) {
    return <div className="h-dvh w-full bg-background" aria-hidden="true" />
  }

  if (!child) {
    return (
      <main className="flex min-h-dvh w-full items-start justify-center bg-background">
        <IntakeForm onComplete={handleIntakeComplete} />
      </main>
    )
  }

  return (
    <main className="flex h-dvh w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden h-full w-80 shrink-0 border-r border-border/60 bg-sidebar md:block">
        <TriageSidebar state={triage} childProfile={child} />
      </div>

      {/* Chat */}
      <ChatPanel
        childProfile={child}
        onStateChange={handleStateChange}
        onToggleSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm border-r border-border/60 bg-sidebar md:hidden"
              aria-label="Panel de triaje"
            >
              <div className="relative h-full">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 z-10"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Cerrar panel"
                >
                  <X className="size-4" />
                </Button>
                <TriageSidebar state={triage} childProfile={child} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
