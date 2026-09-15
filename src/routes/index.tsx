import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Jornada de Sophia — Um Enigma de Hexatombe" },
      {
        name: "description",
        content:
          "Uma aventura de enigmas no mundo de Hexatombe. Responda sobre os personagens, colete as palavras e revele a mensagem final.",
      },
      { property: "og:title", content: "A Jornada de Sophia — Um Enigma de Hexatombe" },
      {
        property: "og:description",
        content:
          "Responda sobre os personagens de Hexatombe, colete as palavras e revele a mensagem final.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital@0;1&display=swap",
      },
    ],
  }),
  component: Journey,
});

type WordKey = "volta" | "pra" | "mim";

const WORD_LABEL: Record<WordKey, string> = {
  volta: "VOLTA",
  pra: "PRA",
  mim: "MIM",
};

const STORAGE_KEY = "sophia-journey-progress-v2";

interface Progress {
  started: boolean;
  solved: Record<WordKey, boolean>;
  finished: boolean;
}

const INITIAL: Progress = {
  started: false,
  solved: { volta: false, pra: false, mim: false },
  finished: false,
};

function loadProgress(): Progress {
  if (typeof window === "undefined") return INITIAL;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    return { ...INITIAL, ...JSON.parse(raw) };
  } catch {
    return INITIAL;
  }
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type Question =
  | {
      kind: "choice";
      prompt: string;
      options: string[];
      correct: string;
      hint: string;
    }
  | {
      kind: "text";
      prompt: string;
      answers: string[];
      hint: string;
    };

interface Trial {
  title: string;
  lore: string;
  questions: Question[];
}

const TRIALS: Record<WordKey, Trial> = {
  volta: {
    title: "Runa I — O Colosso",
    lore: "A primeira runa guarda lembranças de corpos trocados e arenas do submundo ocultista. Responda sobre os assassinos de Hexatombe para ativá-la.",
    questions: [
      {
        kind: "choice",
        prompt: "Em Hexatombe, qual assassino em série é conhecido como 'o Colosso' e luta em arenas do submundo ocultista?",
        options: ["Dalmo Magno", "Jonas Aguiar", "Jae-Yoon", "Arnaldo Fritz"],
        correct: "Dalmo Magno",
        hint: "Ele era motorista de ônibus antes de virar lenda das arenas.",
      },
      {
        kind: "choice",
        prompt: "Quem acorda preso no corpo de Dalmo Magno, o Colosso?",
        options: ["Tuco Belez", "Jasper", "Maria", "Guizo"],
        correct: "Tuco Belez",
        hint: "Um agente da Ordem... que agora é grande, mas não é dois.",
      },
      {
        kind: "text",
        prompt: "Enigma final da runa: eu falo sem boca e escuto sem ouvidos. Não tenho corpo, mas ganho vida com o vento e as montanhas. O que eu sou?",
        answers: ["eco"],
        hint: "Você grita num vale... e eu respondo.",
      },
    ],
  },
  pra: {
    title: "Runa II — O X",
    lore: "A segunda runa sussurra sobre um assassino marcado por uma letra. Decifre os enigmas para fazê-la brilhar.",
    questions: [
      {
        kind: "choice",
        prompt: "Em Hexatombe, Jae-Yoon é conhecido por qual codinome?",
        options: ["O X", "O Colosso", "O Eremita", "O Mago"],
        correct: "O X",
        hint: "Uma única letra marca esse assassino.",
      },
      {
        kind: "choice",
        prompt: "No corpo de qual assassino Maria acorda em Hexatombe?",
        options: ["Jae-Yoon", "Dalmo Magno", "Jonas Aguiar", "Clarissa Leão"],
        correct: "Jae-Yoon",
        hint: "O mesmo personagem da pergunta anterior.",
      },
      {
        kind: "text",
        prompt: "Uma inscrição mágica brilha na pedra: S U D. Cada letra andou 3 casas para frente no alfabeto. Recue 3 para ler a verdade.",
        answers: ["pra"],
        hint: "S→P, U→R, D→A... recue 3 casas.",
      },
    ],
  },
  mim: {
    title: "Runa III — O Receptáculo",
    lore: "A última runa olha para dentro. Fala de mestres, corpos e da verdade que só faz sentido quando vem de você.",
    questions: [
      {
        kind: "choice",
        prompt: "Em Hexatombe, Jasper assume o corpo de qual assassino?",
        options: ["Jonas Aguiar", "Dalmo Magno", "Jae-Yoon", "Dante"],
        correct: "Jonas Aguiar",
        hint: "Não é o Colosso nem o X...",
      },
      {
        kind: "choice",
        prompt: "Quem é o mestre da campanha Hexatombe?",
        options: ["Cellbit", "Calango", "Guaxinim", "Rakin"],
        correct: "Cellbit",
        hint: "O criador de Ordem Paranormal.",
      },
      {
        kind: "text",
        prompt: "Enigma final da runa: quando você pensa em si mesma, eu existo. Sou a palavra que só faz sentido quando vem de você. O que sou?",
        answers: ["eu"],
        hint: "Duas letras. Começa com 'E' e termina com 'U'.",
      },
    ],
  },
};

const ORDER: WordKey[] = ["volta", "pra", "mim"];

function Journey() {
  const [progress, setProgress] = useState<Progress>(INITIAL);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress]);

  const solvedCount = Object.values(progress.solved).filter(Boolean).length;

  const solve = (key: WordKey) =>
    setProgress((p) => ({ ...p, solved: { ...p.solved, [key]: true } }));

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, oklch(0.08 0.02 240 / 0.85) 100%)",
        }}
      />
      <Motes />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-4 py-12">
        <Header solvedCount={solvedCount} />

        {!progress.started ? (
          <Intro onBegin={() => setProgress((p) => ({ ...p, started: true }))} />
        ) : progress.finished ? (
          <FinalReveal />
        ) : (
          <div className="mt-10 flex w-full flex-col gap-8">
            <CollectedWords solved={progress.solved} />

            {ORDER.map((key, i) => (
              <PuzzleCard
                key={key}
                word={key}
                trial={TRIALS[key]}
                locked={i > 0 && !progress.solved[ORDER[i - 1]!]}
                solved={progress.solved[key]}
                onSolve={() => solve(key)}
              />
            ))}

            {solvedCount === 3 && (
              <FinalGate
                onComplete={() => setProgress((p) => ({ ...p, finished: true }))}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Header({ solvedCount }: { solvedCount: number }) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <Sigil />
      <h1 className="font-rune text-glow-gold animate-flicker text-3xl tracking-[0.25em] text-gold sm:text-4xl">
        A JORNADA
      </h1>
      <p className="font-display text-sm italic tracking-widest text-muted-foreground">
        {solvedCount === 0 && "três runas guardam três palavras"}
        {solvedCount === 1 && "a primeira runa foi ativada"}
        {solvedCount === 2 && "apenas uma runa resta"}
        {solvedCount === 3 && "todas as runas brilham — complete a jornada"}
      </p>
    </header>
  );
}

function Sigil() {
  return (
    <div className="sigil-ring relative h-28 w-28 rounded-full bg-veil">
      <svg viewBox="0 0 100 100" className="animate-slow-spin absolute inset-0 h-full w-full p-2">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--gold-dim)" strokeWidth="0.75" />
        <polygon
          points="50,15 80,38 80,72 50,95 20,72 20,38"
          fill="none"
          stroke="var(--magic-bright)"
          strokeWidth="0.9"
        />
        <circle cx="50" cy="50" r="22" fill="none" stroke="var(--magic)" strokeWidth="0.75" />
        <path
          d="M50 35 L50 65 M35 50 L65 50"
          fill="none"
          stroke="var(--gold-dim)"
          strokeWidth="0.6"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-rune text-glow-magic text-xl text-magic-bright">S</span>
      </div>
    </div>
  );
}

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="mt-10 flex w-full flex-col items-center gap-6 text-center">
      <p className="font-display max-w-md text-lg leading-relaxed text-foreground/90">
        Sophia, aventureira... a jornada começou.
      </p>
      <p className="max-w-md text-base leading-relaxed text-muted-foreground">
        Três runas mágicas guardam três palavras. Para ativar cada uma, você vai
        precisar provar que conhece os assassinos de Hexatombe — e desvendar um
        enigma final em cada runa.
      </p>
      <p className="max-w-md text-base italic leading-relaxed text-muted-foreground">
        Nove provas. Três palavras. No fim, o portal se abre.
      </p>
      <button
        onClick={onBegin}
        className="font-rune sigil-ring mt-4 rounded-md bg-magic px-10 py-4 text-sm tracking-[0.3em] text-primary-foreground transition-all hover:bg-magic-bright hover:tracking-[0.4em]"
      >
        COMEÇAR A JORNADA
      </button>
    </section>
  );
}

function CollectedWords({ solved }: { solved: Record<WordKey, boolean> }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {ORDER.map((key) => (
        <div
          key={key}
          className={`font-rune sigil-ring flex h-14 w-24 items-center justify-center rounded-md text-sm tracking-[0.2em] transition-all duration-700 ${
            solved[key]
              ? "text-glow-gold bg-veil text-gold"
              : "bg-secondary text-muted-foreground/40"
          }`}
        >
          {solved[key] ? WORD_LABEL[key] : "???"}
        </div>
      ))}
    </div>
  );
}

interface PuzzleCardProps {
  word: WordKey;
  trial: Trial;
  locked: boolean;
  solved: boolean;
  onSolve: () => void;
}

function PuzzleCard({ word, trial, locked, solved, onSolve }: PuzzleCardProps) {
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [justSolved, setJustSolved] = useState(false);

  const questions = trial?.questions ?? [];
  const question = questions[step];
  const isLast = step === questions.length - 1;

  if (!question) return null;

  const flashError = () => {
    setError(true);
    setTimeout(() => setError(false), 1200);
  };

  const advance = () => {
    setValue("");
    setShowHint(false);
    if (isLast) {
      setJustSolved(true);
      setTimeout(onSolve, 1600);
    } else {
      setStep((s) => s + 1);
    }
  };

  const submitText = () => {
    if (question.kind !== "text") return;
    if (question.answers.includes(normalize(value))) {
      advance();
    } else {
      flashError();
    }
  };

  const submitChoice = (option: string) => {
    if (question.kind !== "choice") return;
    if (option === question.correct) {
      advance();
    } else {
      flashError();
    }
  };

  return (
    <section
      className={`relative rounded-lg border p-6 transition-all duration-700 ${
        locked
          ? "border-border bg-card/40 opacity-50"
          : solved
            ? "border-gold/40 bg-veil"
            : "border-magic/40 bg-card"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-rune text-sm tracking-[0.25em] text-gold">{trial.title}</h2>
        {!locked && !solved && (
          <span className="font-rune text-[10px] tracking-[0.25em] text-muted-foreground">
            PROVA {step + 1}/{questions.length}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm italic leading-relaxed text-muted-foreground">{trial.lore}</p>

      {locked ? (
        <p className="font-rune mt-6 text-center text-xs tracking-[0.3em] text-muted-foreground">
          ✦ INATIVA — ATIVE A RUNA ANTERIOR ✦
        </p>
      ) : solved ? (
        <div className="animate-reveal-message mt-6 text-center">
          <p className="text-xs tracking-widest text-muted-foreground">a palavra revelada:</p>
          <p className="font-rune text-glow-gold mt-2 text-3xl tracking-[0.35em] text-gold">
            {WORD_LABEL[word]}
          </p>
        </div>
      ) : (
        <div className="mt-5">
          {/* progress dots */}
          <div className="mb-4 flex gap-2">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  i < step ? "bg-gold" : i === step ? "bg-magic-bright" : "bg-secondary"
                }`}
              />
            ))}
          </div>

          <p className="font-display text-base leading-relaxed text-foreground/90">
            {question.prompt}
          </p>

          {justSolved ? (
            <p className="font-rune text-glow-gold mt-6 animate-pulse text-center tracking-[0.3em] text-gold">
              ✦ A RUNA SE ATIVA ✦
            </p>
          ) : question.kind === "choice" ? (
            <>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {question.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => submitChoice(option)}
                    className={`sigil-ring rounded-md border bg-background/60 px-4 py-3 text-left text-sm transition-colors ${
                      error
                        ? "border-destructive text-foreground"
                        : "border-input text-foreground hover:border-magic hover:bg-magic/10"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {error && (
                <p className="mt-2 text-xs italic text-destructive">
                  a runa rejeita essa resposta... tente de novo.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mt-4 flex gap-2">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitText()}
                  placeholder="diga a resposta..."
                  className={`flex-1 rounded-md border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring ${
                    error ? "border-destructive" : "border-input"
                  }`}
                />
                <button
                  onClick={submitText}
                  className="font-rune rounded-md bg-magic px-5 py-3 text-xs tracking-[0.2em] text-primary-foreground transition-colors hover:bg-magic-bright"
                >
                  DESVENDAR
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs italic text-destructive">
                  a runa ainda está dormindo... essa não é a resposta.
                </p>
              )}
            </>
          )}

          {!justSolved && (
            <>
              <button
                onClick={() => setShowHint((v) => !v)}
                className="mt-3 text-xs italic text-muted-foreground underline-offset-4 hover:text-gold hover:underline"
              >
                {showHint ? "esconder dica" : "pedir uma dica ao mapa"}
              </button>
              {showHint && (
                <p className="mt-2 text-xs italic leading-relaxed text-gold-dim">
                  ✦ {question.hint}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function FinalGate({ onComplete }: { onComplete: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    const attempt = normalize(value).replace(/\s+/g, " ");
    if (attempt === "volta pra mim") {
      onComplete();
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <section className="sigil-ring animate-reveal-message rounded-lg border border-gold/50 bg-veil p-8 text-center">
      <h2 className="font-rune text-glow-gold text-lg tracking-[0.3em] text-gold">
        O PORTAL FINAL
      </h2>
      <p className="mt-3 text-sm italic leading-relaxed text-muted-foreground">
        As três palavras flutuam diante de você. Una-as na ordem certa e escreva
        a frase completa para abrir o portal.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="escreva a frase completa..."
          className={`flex-1 rounded-md border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring ${
            error ? "border-destructive" : "border-input"
          }`}
        />
        <button
          onClick={submit}
          className="font-rune rounded-md bg-gold px-6 py-3 text-xs tracking-[0.2em] text-accent-foreground transition-opacity hover:opacity-90"
        >
          ABRIR O PORTAL
        </button>
      </div>
      {error && (
        <p className="mt-3 text-xs italic text-destructive">
          a ordem das palavras importa... tente de novo.
        </p>
      )}
    </section>
  );
}

function FinalReveal() {
  return (
    <section className="animate-reveal-message mt-12 flex w-full flex-col items-center gap-8 text-center">
      <Sigil />
      <h2 className="font-rune text-glow-gold text-3xl leading-snug tracking-[0.2em] text-gold sm:text-4xl">
        SOPHIA,
        <br />
        VOLTA PRA MIM
      </h2>
      <div className="sigil-ring max-w-md rounded-lg bg-veil p-8">
        <p className="font-display text-lg italic leading-relaxed text-parchment">
          "Entre todas as aventuras, masmorras, mapas e histórias que já vivemos
          juntos... a única coisa que eu realmente quero desvendar é como te ter
          de volta.
        </p>
        <p className="font-display mt-4 text-lg italic leading-relaxed text-parchment">
          Você é minha companheira de party favorita, minha parceira de campanha,
          meu ponto de sanidade no caos. Sem você, até os dados rolam mais baixo.
        </p>
        <p className="font-display mt-4 text-lg italic leading-relaxed text-parchment">
          Volta pra mim. Te amo."
        </p>
        <p className="font-rune mt-6 text-xs tracking-[0.3em] text-magic-bright">
          ✦ A JORNADA ESTÁ COMPLETA ✦
        </p>
      </div>
    </section>
  );
}

function Motes() {
  const motes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${(i * 53) % 100}%`,
        size: 2 + ((i * 7) % 3),
        duration: 14 + ((i * 13) % 12),
        delay: (i * 2.3) % 14,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {motes.map((m) => (
        <span
          key={m.id}
          className="mote"
          style={{
            left: m.left,
            width: m.size,
            height: m.size,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
