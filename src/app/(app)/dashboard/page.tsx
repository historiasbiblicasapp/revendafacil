'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DollarSign, TrendingUp, TrendingDown, Users, Package,
  ShoppingCart, Receipt, Percent,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

export default function DashboardPage() {
  const supabase = createClient()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      const mesAtual = new Date().getMonth() + 1
      const anoAtual = new Date().getFullYear()

      const { data: vendas } = await supabase
        .from('vendas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'concluida')
        .gte('created_at', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)

      const { data: clientes } = await supabase
        .from('clientes')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)

      const { data: produtos } = await supabase
        .from('produtos')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)

      const { data: contas } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('user_id', user.id)

      const { data: despesas } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)

      const totalVendido = vendas?.reduce((acc, v) => acc + Number(v.valor_total), 0) || 0
      const lucroTotal = vendas?.reduce((acc, v) => acc + Number(v.lucro_total), 0) || 0
      const totalRecebido = contas?.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor), 0) || 0
      const totalPendente = contas?.filter(c => c.status === 'pendente' || c.status === 'atrasado').reduce((acc, c) => acc + Number(c.valor), 0) || 0
      const totalDespesas = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0

      // Vendas por mes (ultimos 6 meses)
      const vendasPorMes: any[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const mes = d.getMonth() + 1
        const ano = d.getFullYear()
        const { data: vendasMes } = await supabase
          .from('vendas')
          .select('valor_total, lucro_total')
          .eq('user_id', user.id)
          .eq('status', 'concluida')
          .gte('created_at', `${ano}-${String(mes).padStart(2, '0')}-01`)
          .lt('created_at', mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`)
        const total = vendasMes?.reduce((acc, v) => acc + Number(v.valor_total), 0) || 0
        const lucro = vendasMes?.reduce((acc, v) => acc + Number(v.lucro_total), 0) || 0
        vendasPorMes.push({
          mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
          vendas: total,
          lucro,
        })
      }

      // Produtos mais vendidos
      const { data: itens } = await supabase
        .from('itens_venda')
        .select('*, produtos(nome)')
        .in('venda_id', vendas?.map(v => v.id) || [])
        .limit(5)

      const produtosCount: Record<string, number> = {}
      itens?.forEach(item => {
        const nome = (item.produtos as any)?.nome || 'Produto'
        produtosCount[nome] = (produtosCount[nome] || 0) + item.quantidade
      })
      const produtosMaisVendidos = Object.entries(produtosCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([nome, quantidade]) => ({ nome, quantidade }))

      return {
        totalVendido,
        lucroTotal,
        totalRecebido,
        totalPendente,
        totalDespesas,
        lucroLiquido: lucroTotal - totalDespesas,
        qtdClientes: clientes?.length || 0,
        qtdProdutos: produtos?.length || 0,
        vendasPorMes,
        produtosMaisVendidos,
      }
    },
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const cards = [
    { title: 'Total Vendido (Mês)', value: stats?.totalVendido || 0, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Recebido', value: stats?.totalRecebido || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Pendente', value: stats?.totalPendente || 0, icon: Receipt, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Lucro Bruto', value: stats?.lucroTotal || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Lucro Líquido', value: (stats?.lucroLiquido ?? 0), icon: Percent, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Despesas (Mês)', value: stats?.totalDespesas || 0, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Clientes', value: stats?.qtdClientes || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Produtos', value: stats?.qtdProdutos || 0, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">
                      {card.title.includes('Clientes') || card.title.includes('Produtos')
                        ? stats?.[card.title === 'Clientes' ? 'qtdClientes' : 'qtdProdutos']
                        : `R$ ${(card.value as number).toFixed(2).replace('.', ',')}`}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bg}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vendas" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lucro por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.vendasPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {stats?.produtosMaisVendidos && stats.produtosMaisVendidos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.produtosMaisVendidos}
                    dataKey="quantidade"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.produtosMaisVendidos.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
