import {
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Tâches du jour' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="min-h-screen flex flex-col bg-background">
          <main className="flex-1 pb-20">{children}</main>
          <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50 shadow-lg">
            <Link
              to="/"
              className="flex-1 flex flex-col items-center justify-center py-3 text-sm font-bold gap-1 text-muted-foreground transition-colors [&.active]:text-primary"
            >
              <span className="text-xl">✅</span>
              Tâches
            </Link>
            <Link
              to="/recompenses"
              className="flex-1 flex flex-col items-center justify-center py-3 text-sm font-bold gap-1 text-muted-foreground transition-colors [&.active]:text-primary"
            >
              <span className="text-xl">🎁</span>
              Récompenses
            </Link>
            <Link
              to="/parents"
              className="flex-1 flex flex-col items-center justify-center py-3 text-sm font-bold gap-1 text-muted-foreground transition-colors [&.active]:text-primary"
            >
              <span className="text-xl">👨‍👩‍👧‍👦</span>
              Parents
            </Link>
          </nav>
        </div>
        <Scripts />
      </body>
    </html>
  )
}
