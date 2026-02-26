import { Button } from "@/components/ui/button";

export function Landing() {
  const stackBenefits = [
    {
      title: "Vite + Rolldown",
      description:
        "Fast startup, instant HMR, and production builds that stay quick as your codebase grows.",
    },
    {
      title: "React 19 + TypeScript",
      description:
        "Modern React capabilities with strict typing to catch mistakes earlier and scale safely.",
    },
    {
      title: "TanStack Router",
      description:
        "Type-safe file-based routing with an auto-generated route tree and predictable navigation.",
    },
    {
      title: "TanStack Query",
      description:
        "Built-in query client defaults for caching, retries, refetching, and clean server-state flows.",
    },
    {
      title: "Tailwind CSS v4",
      description:
        "Utility-first styling with a fast workflow for responsive UI without context switching.",
    },
    {
      title: "shadcn/ui + Radix",
      description:
        "Accessible component primitives and composable UI patterns ready for product-level interfaces.",
    },
    {
      title: "Vitest + Testing Library",
      description:
        "Preconfigured unit and component testing so quality checks are easy from day one.",
    },
    {
      title: "ESLint + Prettier",
      description:
        "Consistent formatting, import hygiene, and static checks to keep team code clean and readable.",
    },
    {
      title: "GitHub Actions CI",
      description:
        "Automated type-check, lint, test, and build validation on every push or pull request.",
    },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 py-12 md:py-20">
      <section className="rounded-2xl border bg-gradient-to-b from-muted/60 to-background p-8 text-center shadow-sm md:p-12">
        <h1 className="scroll-m-20 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Build faster with a focused React starter
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground md:text-xl">
          This boilerplate is intentionally minimal: one landing page, strong
          defaults, and a production-ready stack so you can move from idea to
          feature work immediately.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <a href="#stack-benefits">See stack benefits</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/wictorstenseke/vite-react-fe"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </Button>
        </div>
      </section>

      <section id="stack-benefits" aria-label="Stack benefits">
        <div className="mb-6 space-y-2">
          <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight md:text-4xl">
            Why this boilerplate is a solid default
          </h2>
          <p className="text-muted-foreground">
            Every included tool solves a real setup problem so you avoid
            repetitive project bootstrapping work.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stackBenefits.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
            >
              <h3 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
