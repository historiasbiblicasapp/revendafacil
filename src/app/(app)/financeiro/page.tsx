'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, Wallet } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export default function FinanceiroPage() {
  const supabase = createClient()
  const [periodo, setPeriodo] = useState('mes')

  const { data, isLoading } = useQuery({
    queryKey: ['financeiro', periodo],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      let startDate = new Date()
      if (periodo === 'mes') startDate.setMonth(startDate.getMonth() - 1)
      else if (periodo === 'semana') startDate.setDate(startDate.getDate() - 7)
      else if (periodo === 'ano') startDate.setFullYear(startDate.getFullYear() - 1)
      else startDate = new Date(0)
      const start = startDate.toISOString()

      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_total, lucro_total, created_at')
        .eq('user_id', user.id)
        .eq('status', 'concluida')
        .gte('created_at', start)

      const { data: contas } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('user_id', user.id)

      const { data: despesas } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', start.split('T')[0])

      const entradas = vendas?.reduce((acc, v) => acc + Number(v.valor_total), 0) || 0
      const saidas = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0
      const lucroBruto = vendas?.reduce((acc, v) => acc + Number(v.lucro_total), 0) || 0
      const lucroLiquido = lucroBruto - saidas
      const totalRecebido = contas?.filter(c => c.status === 'pago').reduce((acc, c) => acc + Number(c.valor), 0) || 0
      const totalPendente = contas?.filter(c => c.status === 'pendente' || c.status === 'atrasado').reduce((acc, c) => acc + Number(c.valor), 0) || 0
      const saldoAtual = totalRecebido - saidas

      // Fluxo de caixa (entradas vs saidas por mes)
      const fluxo: any[] = []
      const meses = periodo === 'ano' ? 12 : periodo === 'mes' ? 4 : 1
      for (let i = meses - 1; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const mes = d.getMonth() + 1
        const ano = d.getFullYear()
        const mesStr = `${ano}-${String(mes).padStart(2, '0')}`

        const { data: vendasMes } = await supabase
          .from('vendas')
          .select('valor_total')
          .eq('user_id', user.id)
          .eq('status', 'concluida')
          .gte('created_at', `${mesStr}-01`)
          .lt('created_at', mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`)

        const { data: despesasMes } = await supabase
          .from('despesas')
          .select('valor')
          .eq('user_id', user.id)
          .gte('data', `${mesStr}-01`)
          .lt('data', mes === 12 ? `${ano + 1}-01-01` : `${ano}-${String(mes + 1).padStart(2, '0')}-01`)

        const entradasMes = vendasMes?.reduce((acc, v) => acc + Number(v.valor_total), 0) || 0
        const saidasMes = despesasMes?.reduce((acc, d) => acc + Number(d.valor), 0) || 0

        fluxo.push({
          mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
          entradas: entradasMes,
          saidas: saidasMes,
          saldo: entradasMes - saidasMes,
        })
      }

      return { entradas, saidas, lucroBruto, lucroLiquido, saldoAtual, totalRecebido, totalPendente, fluxo }
    },
  })

  const cards = [
    { title: 'Entradas', value: data?.entradas || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Saídas', value: data?.saidas || 0, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Lucro Bruto', value: data?.lucroBruto || 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Lucro Líquido', value: data?.lucroLiquido ?? 0, icon: PiggyBank, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Saldo Atual', value: data?.saldoAtual ?? 0, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'A Receber', value: data?.totalPendente || 0, icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dia">Hoje</SelectItem>
            <SelectItem value="semana">Esta Semana</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
            <SelectItem value="ano">Este Ano</SelectItem>
            <SelectItem value="todo">Todo Período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map(card => {
              const Icon = card.icon
              return (
                <Card key={card.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-2xl font-bold mt-1">
                          R$ {card.value.toFixed(2).replace('.', ',')}
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

          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data?.fluxo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
