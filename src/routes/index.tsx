import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  ExternalLink,
  Fingerprint,
  Globe2,
  LockKeyhole,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verificação de Segurança" },
      {
        name: "description",
        content: "Verificação rápida de segurança para proteger o acesso e confirmar uma conexão humana.",
      },
      { property: "og:title", content: "Verificação de Segurança" },
      {
        property: "og:description",
        content: "Confirme sua conexão para continuar com segurança.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationPage,
});

type VerificationState = "idle" | "checking" | "success";

type PageSettings = {
  destination: string;
  delay: number;
  title: string;
  description: string;
  buttonText: string;
  autoRedirect: boolean;
};

const DEFAULT_SETTINGS: PageSettings = {
  destination: "https://example.com",
  delay: 3,
  title: "Verificação de segurança",
  description: "Precisamos confirmar que você é uma pessoa antes de continuar.",
  buttonText: "Não sou um robô",
  autoRedirect: true,
};

function getSafeDestination(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function getDestinationLabel(value: string) {
  const safeUrl = getSafeDestination(value);
  if (!safeUrl) return "Destino ainda não configurado";
  return new URL(safeUrl).hostname.replace(/^www\./, "");
}

function VerificationPage() {
  const [status, setStatus] = useState<VerificationState>("idle");
  const [settings, setSettings] = useState<PageSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<PageSettings>(DEFAULT_SETTINGS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.delay);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const queryDestination = search.get("url");
    const stored = window.localStorage.getItem("security-page-settings");
    let nextSettings = DEFAULT_SETTINGS;

    if (stored) {
      try {
        nextSettings = { ...DEFAULT_SETTINGS, ...(JSON.parse(stored) as Partial<PageSettings>) };
      } catch {
        window.localStorage.removeItem("security-page-settings");
      }
    }

    if (queryDestination) {
      const safeQueryDestination = getSafeDestination(queryDestination);
      if (safeQueryDestination) nextSettings = { ...nextSettings, destination: safeQueryDestination };
    }

    setSettings(nextSettings);
    setDraft(nextSettings);
    setSecondsLeft(nextSettings.delay);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const destinationLabel = useMemo(
    () => getDestinationLabel(settings.destination),
    [settings.destination],
  );

  const redirectNow = () => {
    const destination = getSafeDestination(settings.destination);
    if (destination) window.location.assign(destination);
  };

  const startVerification = () => {
    if (status !== "idle") return;
    setStatus("checking");
    window.setTimeout(() => {
      setStatus("success");
      setSecondsLeft(settings.delay);

      if (!settings.autoRedirect) return;
      if (settings.delay === 0) {
        redirectNow();
        return;
      }

      timerRef.current = window.setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            if (timerRef.current !== null) window.clearInterval(timerRef.current);
            window.setTimeout(redirectNow, 100);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }, 1800);
  };

  const saveSettings = () => {
    const destination = getSafeDestination(draft.destination);
    if (!destination) {
      setUrlError("Informe uma URL completa iniciada por https:// ou http://");
      return;
    }

    const nextSettings = { ...draft, destination };
    setSettings(nextSettings);
    setDraft(nextSettings);
    setUrlError("");
    setStatus("idle");
    setSecondsLeft(nextSettings.delay);
    window.localStorage.setItem("security-page-settings", JSON.stringify(nextSettings));
    setPanelOpen(false);
  };

  const resetTest = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setStatus("idle");
    setSecondsLeft(settings.delay);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="security-grid pointer-events-none absolute inset-0" />

      <header className="relative z-10 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:h-[72px] sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Acesso protegido</p>
              <p className="truncate text-xs text-muted-foreground">Verificação de conexão segura</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-trust">
            <span className="status-pulse size-2 rounded-full bg-trust" />
            <span className="hidden sm:inline">Sistema operacional</span>
            <span className="sm:hidden">Online</span>
          </div>
        </div>
      </header>

      <section className="relative z-[1] mx-auto flex min-h-[calc(100dvh-136px)] w-full max-w-6xl items-center justify-center px-5 py-10 sm:px-8 sm:py-16">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 flex justify-center">
            <div className="shield-mark relative grid size-20 place-items-center rounded-full border border-primary/15 bg-primary/5 text-primary sm:size-24">
              {status === "success" ? (
                <CircleCheck className="size-10 sm:size-12" strokeWidth={1.7} />
              ) : (
                <LockKeyhole className="size-9 sm:size-11" strokeWidth={1.7} />
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Proteção em andamento
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-normal sm:text-[2.65rem] sm:leading-tight">
              {status === "success" ? "Verificação concluída" : settings.title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
              {status === "success"
                ? "Sua conexão foi validada. Você já pode continuar com segurança."
                : settings.description}
            </p>
          </div>

          <div className="mt-8 border border-border bg-card p-3 shadow-security sm:mt-10 sm:p-4">
            <button
              type="button"
              onClick={startVerification}
              disabled={status !== "idle"}
              className="verification-control grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-md border border-border bg-background p-4 text-left transition-[border-color,box-shadow,transform] hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default sm:p-5"
              aria-live="polite"
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-[5px] border-2 transition-all sm:size-10 ${
                  status === "success"
                    ? "border-trust bg-trust text-trust-foreground"
                    : status === "checking"
                      ? "border-primary/25"
                      : "border-input bg-card"
                }`}
              >
                {status === "checking" && <span className="security-spinner size-5 rounded-full" />}
                {status === "success" && <Check className="size-6" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold sm:text-base">
                  {status === "checking"
                    ? "Verificando segurança..."
                    : status === "success"
                      ? "Conexão verificada"
                      : settings.buttonText}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {status === "checking"
                    ? "Analisando a integridade da sessão"
                    : status === "success"
                      ? `Destino: ${destinationLabel}`
                      : "Clique para iniciar a validação"}
                </span>
              </span>
              <ShieldCheck className="size-6 shrink-0 text-primary/70" strokeWidth={1.8} />
            </button>

            {status === "checking" && (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                <div className="security-progress h-full rounded-full bg-primary" />
              </div>
            )}

            {status === "success" && (
              <div className="mt-3 flex flex-col gap-3 rounded-md bg-trust-soft px-4 py-3 text-sm text-trust sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <Clock3 className="size-4 shrink-0" />
                  {settings.autoRedirect
                    ? `Continuando em ${secondsLeft}s`
                    : "Redirecionamento automático desativado"}
                </span>
                <Button size="sm" onClick={redirectNow} className="w-full sm:w-auto">
                  Continuar agora <ChevronRight />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-border text-center">
            {([
              [LockKeyhole, "SSL ativo"],
              [Fingerprint, "Dados protegidos"],
              [Globe2, "Conexão segura"],
            ] as Array<[LucideIcon, string]>).map(([Icon, label]) => (
              <div key={label} className="flex min-w-0 flex-col items-center gap-2 px-2 text-muted-foreground">
                <Icon className="size-4 text-primary" strokeWidth={1.8} />
                <span className="text-[10px] font-medium sm:text-xs">{label}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground/80">
            Esta etapa ajuda a prevenir acessos automatizados e mantém a navegação protegida.
          </p>
        </div>
      </section>

      <footer className="relative z-[1] flex min-h-16 items-center justify-center border-t border-border/70 px-5 py-4 text-center text-[11px] text-muted-foreground sm:text-xs">
        <span className="inline-flex items-center gap-2">
          <LockKeyhole className="size-3.5" /> Ambiente protegido por criptografia de ponta a ponta
        </span>
      </footer>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setPanelOpen(true)}
        aria-label="Abrir configurações"
        title="Configurações"
        className="fixed bottom-5 right-5 z-30 size-11 rounded-full bg-background shadow-lg sm:bottom-7 sm:right-7"
      >
        <Settings2 className="size-5" />
      </Button>

      <div
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] transition-opacity ${panelOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setPanelOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-dvh w-full max-w-[390px] overflow-y-auto border-l border-border bg-background p-6 shadow-2xl transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!panelOpen}
        aria-label="Configurações da verificação"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <SlidersHorizontal className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em]">Painel de teste</span>
            </div>
            <h2 className="text-xl font-semibold">Configurar experiência</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Ajuste o destino, o tempo e os textos exibidos.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setPanelOpen(false)} aria-label="Fechar painel">
            <X />
          </Button>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="destination">URL de destino</Label>
            <Input
              id="destination"
              type="url"
              value={draft.destination}
              onChange={(event) => {
                setDraft({ ...draft, destination: event.target.value });
                setUrlError("");
              }}
              placeholder="https://seusite.com"
              aria-invalid={Boolean(urlError)}
              className="h-11"
            />
            {urlError ? (
              <p className="text-xs text-destructive">{urlError}</p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="size-3" /> Também aceita o parâmetro ?url=https://...
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="delay">Tempo para redirecionar</Label>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{draft.delay}s</span>
            </div>
            <input
              id="delay"
              type="range"
              min="0"
              max="10"
              step="1"
              value={draft.delay}
              onChange={(event) => setDraft({ ...draft, delay: Number(event.target.value) })}
              className="config-range w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Imediato</span><span>10 segundos</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-y border-border py-4">
            <div>
              <Label htmlFor="auto-redirect">Redirecionar automaticamente</Label>
              <p className="mt-1 text-xs text-muted-foreground">Após a verificação ser concluída</p>
            </div>
            <Switch
              id="auto-redirect"
              checked={draft.autoRedirect}
              onCheckedChange={(checked) => setDraft({ ...draft, autoRedirect: checked })}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" maxLength={70} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" maxLength={150} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button-text">Texto da verificação</Label>
              <Input id="button-text" maxLength={50} value={draft.buttonText} onChange={(event) => setDraft({ ...draft, buttonText: event.target.value })} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          <Button type="button" variant="outline" size="icon" onClick={resetTest} title="Reiniciar teste" aria-label="Reiniciar teste">
            <RotateCcw />
          </Button>
          <Button type="button" onClick={saveSettings}>Salvar e testar</Button>
        </div>
      </aside>
    </main>
  );
}