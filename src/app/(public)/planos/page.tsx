import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Teste Grátis',
    price: 'Grátis',
    period: '7 dias',
    description: 'Experimente sem compromisso',
    highlight: false,
    features: [
      'Catálogo de produtos',
      'Clientes ilimitados',
      'Controle de estoque',
      'Registro de vendas',
      'Contas a receber',
      'Despesas',
      'Relatórios',
      'Catálogo online para clientes',
    ],
  },
  {
    name: 'Mensal',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Para quem já está vendendo',
    highlight: true,
    features: [
      'Tudo do Plano Grátis',
      'Metas de vendas',
      'Dashboard completo',
      'Financeiro completo',
      'Suporte prioritário',
      'Sem anúncios',
    ],
  },
  {
    name: 'Anual',
    price: 'R$ 199,90',
    period: '/ano',
    description: 'Economize 44%',
    highlight: false,
    features: [
      'Tudo do Plano Mensal',
      '2 meses grátis',
      'Suporte VIP',
      'Prioridade em novas features',
      'Migração assistida',
    ],
  },
]

export default function PlanosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">Revenda Fácil</Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
            <Link href="/cadastro" className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90">Começar Grátis</Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Planos <span className="text-primary">Revenda Fácil</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tudo que você precisa para gerenciar suas revendas em um só lugar.
          Comece grátis e upgrade quando quiser.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlight
                  ? 'border-primary shadow-xl shadow-primary/10 bg-white scale-105 md:scale-105'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">Mais Popular</span>
              )}
              <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === 'Teste Grátis' ? '/cadastro' : 'https://wa.me/5524988112657?text=Quero%20assinar%20o%20plano%20' + encodeURIComponent(plan.name)}
                className={`block text-center mt-8 py-3 rounded-xl font-medium text-sm ${
                  plan.highlight
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'border border-primary text-primary hover:bg-primary/5'
                }`}
              >
                {plan.name === 'Teste Grátis' ? 'Começar Grátis' : 'Falar com Admin'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Comparação de Recursos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Recurso</th>
                  <th className="py-3 px-4 font-medium">Teste Grátis</th>
                  <th className="py-3 px-4 font-medium text-primary">Mensal</th>
                  <th className="py-3 px-4 font-medium">Anual</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Clientes ilimitados', true, true, true],
                  ['Produtos ilimitados', true, true, true],
                  ['Marcas', true, true, true],
                  ['Controle de estoque', true, true, true],
                  ['Vendas', true, true, true],
                  ['Contas a receber', true, true, true],
                  ['Despesas', true, true, true],
                  ['Relatórios', true, true, true],
                  ['Catálogo online', true, true, true],
                  ['Metas de vendas', false, true, true],
                  ['Dashboard', false, true, true],
                  ['Financeiro completo', false, true, true],
                  ['Suporte prioritário', false, true, true],
                  ['Suporte VIP', false, false, true],
                ].map(([name, free, mensal, anual]) => (
                  <tr key={name as string} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{name as string}</td>
                    <td className="py-3 px-4 text-center">{free ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : '—'}</td>
                    <td className="py-3 px-4 text-center">{mensal ? <Check className="h-4 w-4 text-primary mx-auto" /> : '—'}</td>
                    <td className="py-3 px-4 text-center">{anual ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="border-t bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Revenda Fácil — Sistema para revendedores de produtos de catálogo</p>
          <p className="mt-1">Entre em contato via WhatsApp para assinar: (24) 98811-2657</p>
        </div>
      </footer>
    </div>
  )
}
