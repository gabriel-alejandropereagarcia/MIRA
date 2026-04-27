"use client"

import { useState } from "react"
import {
  BookOpen,
  ExternalLink,
  FileHeart,
  Phone,
  PlayCircle,
  type LucideIcon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ResourceKey = "hotline" | "referral" | "videos" | "guide" | null

type ResourceCard = {
  key: Exclude<ResourceKey, null>
  icon: LucideIcon
  title: string
  desc: string
}

const RESOURCES: ResourceCard[] = [
  {
    key: "hotline",
    icon: Phone,
    title: "Línea de orientación",
    desc: "Habla con un especialista",
  },
  {
    key: "referral",
    icon: FileHeart,
    title: "Derivación profesional",
    desc: "Directorio de neuropediatras",
  },
  {
    key: "videos",
    icon: PlayCircle,
    title: "Videos Denver",
    desc: "Rutinas guiadas para casa",
  },
  {
    key: "guide",
    icon: BookOpen,
    title: "Guía para padres",
    desc: "Qué esperar paso a paso",
  },
]

const HOTLINES = [
  {
    country: "Argentina",
    name: "Línea 102 — Atención a niños y adolescentes",
    phone: "102",
  },
  {
    country: "México",
    name: "Línea de la Vida",
    phone: "800 911 2000",
  },
  {
    country: "España",
    name: "Teléfono de la Infancia",
    phone: "116 111",
  },
  {
    country: "Estados Unidos",
    name: "CDC Info",
    phone: "1-800-232-4636",
    href: "https://www.cdc.gov/concerned",
  },
]

const VIDEO_LINKS = [
  {
    title: "Modelo Denver — Intervención temprana",
    href: "https://www.youtube.com/results?search_query=early+start+denver+model+parents",
  },
  {
    title: "Ejercicios de atención conjunta en casa",
    href: "https://www.youtube.com/results?search_query=joint+attention+activities+toddlers",
  },
  {
    title: "Juego interactivo para el desarrollo",
    href: "https://www.youtube.com/results?search_query=interactive+play+autism+early+intervention",
  },
]

const MILESTONES = [
  {
    age: "12 meses",
    items: ["Señala con el dedo", "Responde a su nombre", "Imita gestos simples"],
  },
  {
    age: "18 meses",
    items: ["Primeras palabras", "Juego simbólico simple", "Contacto visual sostenido"],
  },
  {
    age: "24 meses",
    items: ["Combina 2 palabras", "Imita acciones cotidianas", "Juego paralelo con pares"],
  },
  {
    age: "36 meses",
    items: ["Frases de 3+ palabras", "Sigue instrucciones de 2 pasos", "Juega con otros niños"],
  },
]

function ExtLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  )
}

export function ResourceButtons() {
  const [open, setOpen] = useState<ResourceKey>(null)

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {RESOURCES.map((r) => {
          const Icon = r.icon
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setOpen(r.key)}
              className="flex flex-col gap-1 rounded-lg border border-border/60 bg-card p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Icon className="size-4 text-primary" aria-hidden="true" />
              <span className="text-[12px] font-medium leading-tight">
                {r.title}
              </span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                {r.desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Hotlines */}
      <Dialog open={open === "hotline"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="size-4 text-primary" />
              Líneas de orientación
            </DialogTitle>
            <DialogDescription>
              Servicios gratuitos de orientación familiar y atención a la
              infancia en países de habla hispana.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2.5">
            {HOTLINES.map((h) => (
              <li
                key={h.country}
                className="rounded-lg border border-border/60 bg-card/60 p-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {h.country}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {h.name}
                </p>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <a
                    href={`tel:${h.phone.replace(/\s/g, "")}`}
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    {h.phone}
                  </a>
                  {h.href && <ExtLink href={h.href}>Sitio oficial</ExtLink>}
                </div>
              </li>
            ))}
          </ul>

          <DialogFooter className="text-[11px] text-muted-foreground sm:justify-start">
            En caso de emergencia médica acude directamente al servicio de
            urgencias más cercano.
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral */}
      <Dialog
        open={open === "referral"}
        onOpenChange={(v) => !v && setOpen(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileHeart className="size-4 text-primary" />
              Derivación profesional
            </DialogTitle>
            <DialogDescription>
              MIRA es una herramienta de cribado. La confirmación diagnóstica
              corresponde a un profesional calificado.
            </DialogDescription>
          </DialogHeader>

          <section className="space-y-3 text-sm">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Qué profesional buscar
              </h3>
              <ul className="mt-1.5 space-y-1 text-foreground/90">
                <li>• Neuropediatra</li>
                <li>• Psicólogo/a infantil especializado en desarrollo</li>
                <li>• Centro de Atención Temprana</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Qué pedir en la consulta
              </h3>
              <p className="mt-1.5 leading-relaxed text-foreground/90">
                Solicita una <strong>evaluación formal del desarrollo</strong>.
                Lleva una lista escrita con las señales específicas que has
                observado, su frecuencia y desde cuándo aparecen.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Directorios públicos
              </h3>
              <ul className="mt-1.5 space-y-1.5">
                <li>
                  <ExtLink href="https://www.aap.org/findpediatrician">
                    AAP — Buscador de pediatras (USA)
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://www.aeped.es/buscador-pediatras">
                    AEP — Asociación Española de Pediatría
                  </ExtLink>
                </li>
                <li>
                  <ExtLink href="https://www.sap.org.ar/">
                    SAP — Sociedad Argentina de Pediatría
                  </ExtLink>
                </li>
              </ul>
            </div>
          </section>
        </DialogContent>
      </Dialog>

      {/* Videos */}
      <Dialog open={open === "videos"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlayCircle className="size-4 text-primary" />
              Videos Modelo Denver (ESDM)
            </DialogTitle>
            <DialogDescription>
              Material educativo sobre intervención temprana basada en juego.
            </DialogDescription>
          </DialogHeader>

          <ul className="space-y-2">
            {VIDEO_LINKS.map((v) => (
              <li key={v.href}>
                <a
                  href={v.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/60 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="font-medium text-foreground">{v.title}</span>
                  <ExternalLink
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </a>
              </li>
            ))}
          </ul>

          <p className="rounded-md bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-secondary-foreground">
            Estos videos son educativos. Consulta con tu profesional para un
            plan personalizado.
          </p>
        </DialogContent>
      </Dialog>

      {/* Guide */}
      <Dialog open={open === "guide"} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              Guía para padres
            </DialogTitle>
            <DialogDescription>
              Qué esperar en cada etapa y dónde profundizar.
            </DialogDescription>
          </DialogHeader>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Hitos por edad
            </h3>
            <ul className="space-y-2.5 text-sm">
              {MILESTONES.map((m) => (
                <li
                  key={m.age}
                  className="rounded-lg border border-border/60 bg-card/60 p-3"
                >
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {m.age}
                  </p>
                  <ul className="mt-1.5 space-y-0.5 text-foreground/90">
                    {m.items.map((it) => (
                      <li key={it}>• {it}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 border-t border-border/60 pt-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recursos oficiales
            </h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <ExtLink href="https://www.cdc.gov/actearlyespanol">
                  CDC — Aprenda los Signos. Reaccione Pronto.
                </ExtLink>
              </li>
              <li>
                <ExtLink href="https://mchatscreen.com">
                  M-CHAT-R/F oficial
                </ExtLink>
              </li>
            </ul>
          </section>
        </DialogContent>
      </Dialog>
    </>
  )
}
