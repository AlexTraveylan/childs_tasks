import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { verifyParentPassword } from '#/server/auth'

interface ParentPasswordGateProps {
  onUnlocked: () => void
}

export function ParentPasswordGate({ onUnlocked }: ParentPasswordGateProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    const ok = await verifyParentPassword({ data: { input } })
    setLoading(false)
    if (ok) {
      setInput('')
      onUnlocked()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-160px)]">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-lg mx-4">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-2xl font-black">Espace parents</h2>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">
            Entrez votre mot de passe
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mot de passe"
            className="rounded-xl font-semibold"
            autoComplete="current-password"
          />
          {error && (
            <p className="text-destructive text-sm text-center font-bold">
              Mot de passe incorrect
            </p>
          )}
          <Button
            type="submit"
            className="w-full font-black rounded-xl"
            disabled={loading || !input}
          >
            {loading ? '...' : 'Entrer'}
          </Button>
        </form>
      </div>
    </div>
  )
}
