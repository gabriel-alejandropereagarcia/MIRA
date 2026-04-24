"use client"

import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { ChatPanel } from "@/components/mira/chat-panel"
import { TriageSidebar, type TriageState } from "@/components/mira/triage-sidebar"
import { Button } from "@/components/ui/button"

const INITIAL_STATE: TriageState = {
  intake: false,
  mchat: false,
  risk: null,
  denver: false,
  video: false,
}

export default function Page() {
  const [triage, setTriage] = useState<TriageState>(INITIAL_STATE)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleStateChange = useCallback((s: TriageState) => setTriage(s), [])

  return (
    <main className="flex h-dvh w-full bg-background">
      {/* Desktop sidebar */}
      <div className="hidden h-full w-80 shrink-0 border-r border-border/60 bg-sidebar md:block">
        <TriageSidebar state={triage} />
      </div>

      {/* Chat */}
      <ChatPanel
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
                <TriageSidebar state={triage} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
