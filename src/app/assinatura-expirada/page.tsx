import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AssinaturaExpiradaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-4xl">⏰</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Assinatura Expirada</h1>
        <p className="text-muted-foreground">
          Sua assinatura do <strong>Revenda Fácil</strong> expirou.
          Entre em contato com o administrador para renovar.
        </p>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
          <p className="font-medium mb-1">📲 Contato:</p>
          <a
            href="https://wa.me/5511999999999?text=Olá! Quero renovar minha assinatura do Revenda Fácil."
            target="_blank"
            rel="noopener"
            className="text-purple-600 hover:text-purple-800 underline font-medium"
          >
            Fale conosco no WhatsApp
          </a>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm text-muted-foreground hover:text-foreground underline"
        >
          Sair e trocar de conta
        </Link>
      </div>
    </div>
  )
}
