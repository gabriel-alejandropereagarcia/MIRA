"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, X } from "lucide-react"
import { ChatPanel } from "@/components/mira/chat-panel"
import { IntakeForm } from "@/components/mira/intake-form"
import { TriageSidebar, type TriageState } from "@/components/mira/triage-sidebar"
import { Button } from "@/components/ui/button"
import { getProfile, type ChildProfile } from "@/lib/mira-storage"

type Locale = "es" | "en"

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
  // Mirror of the IntakeForm language toggle so the "How it works"
  // chip in the corner stays in sync with whichever locale the
  // caregiver picked (defaults to Spanish to match IntakeForm).
  const [intakeLocale, setIntakeLocale] = useState<Locale>("es")

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
    const linkLabel =
      intakeLocale === "en" ? "How MIRA works" : "Cómo funciona MIRA"
    const linkHref =
      intakeLocale === "en" ? "/como-funciona?lang=en" : "/como-funciona"

    return (
      <main className="relative flex min-h-dvh w-full items-center justify-center bg-background">
        {/* Discreet floating chip in the top-right. Stays out of the
            form's reading flow but is always reachable from any
            scroll position thanks to `fixed`. The pill style + soft
            border + tracking-wide label match the visual language of
            the rest of MIRA's chrome. */}
        <a
          href={linkHref}
          className="group fixed right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/40 hover:text-foreground md:right-6 md:top-6"
          aria-label={linkLabel}
        >
          <span>{linkLabel}</span>
          <ArrowUpRight className="size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
        <IntakeForm
          onComplete={handleIntakeComplete}
          onLocaleChange={setIntakeLocale}
        />
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
