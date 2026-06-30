'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, X, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import type { Venda, Produto, Cliente } from '@/types'

export default function VendasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<'avista' | 'parcelado' | 'fiado'>('avista')
  const [itens, setItens] = useState<{ produto_id: string; nome: string; qtd: number; valor: number; lucro: number }[]>([])
  const [selectedProduto, setSelectedProduto] = useState('')
  const [qtdItem, setQtdItem] = useState('1')

  const { data: vendas, isLoading } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase
        .from('vendas')
        .select('*, clientes(nome), itens_venda(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      return (data || []) as (Venda & { clientes: { nome: string } | null })[]
    },
  })

  const { data: clientes } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user; if (!user) return []
      const { data } = await supabase.from('clientes').select('id, nome').eq('user_id', user.id).order('nome')
      return (data || []) as Pick<Cliente, 'id' | 'nome'>[]
    },
  })

  const { data: produtos } = useQuery({
    queryKey: ['produtos-select'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user; if (!user) return []
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome')
      return (data || []) as Produto[]
    },
  })

  function addItem() {
    const prod = produtos?.find(p => p.id === selectedProduto)
    if (!prod || prod.quantidade_estoque < Number(qtdItem)) {
      toast.error('Produto sem estoque suficiente')
      return
    }
    setItens([...itens, {
      produto_id: prod.id,
      nome: prod.nome,
      qtd: Number(qtdItem),
      valor: prod.valor_venda,
      lucro: prod.lucro_unitario,
    }])
    setSelectedProduto('')
    setQtdItem('1')
  }

  function removeItem(idx: number) {
    setItens(itens.filter((_, i) => i !== idx))
  }

  const totalVenda = itens.reduce((acc, i) => acc + (i.valor * i.qtd), 0)
  const totalLucro = itens.reduce((acc, i) => acc + (i.lucro * i.qtd), 0)

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user || itens.length === 0) throw new Error('Selecione pelo menos um produto')

      const { data: venda, error: errVenda } = await supabase.from('vendas').insert({
        user_id: user.id,
        cliente_id: clienteId || null,
        valor_total: totalVenda,
        lucro_total: totalLucro,
        comissao: 0,
        forma_pagamento: formaPagamento,
        status: 'concluida',
      }).select().single()

      if (errVenda) throw errVenda

      const itensPayload = itens.map(i => ({
        venda_id: venda.id,
        produto_id: i.produto_id,
        quantidade: i.qtd,
        valor_unitario: i.valor,
        valor_total: i.valor * i.qtd,
        lucro_unitario: i.lucro,
      }))

      const { error: errItens } = await supabase.from('itens_venda').insert(itensPayload)
      if (errItens) throw errItens

      if (formaPagamento === 'fiado') {
        await supabase.from('contas_receber').insert({
          user_id: user.id,
          cliente_id: clienteId || null,
          venda_id: venda.id,
          valor: totalVenda,
          data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pendente',
        })
      }

      const hoje = new Date().toISOString().split('T')[0]
      const { data: metasAtivas, error: errMetas } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ativa')
        .lte('data_inicio', hoje)
        .gte('data_fim', hoje)

      if (!errMetas && metasAtivas && metasAtivas.length > 0) {
        for (const meta of metasAtivas) {
          const novoValor = Number(meta.valor_atual) + totalVenda
          const novoStatus = novoValor >= Number(meta.valor_meta) ? 'atingida' : 'ativa'
          await supabase.from('metas').update({
            valor_atual: novoValor,
            status: novoStatus,
          }).eq('id', meta.id)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] })
      toast.success('Venda registrada e adicionada à meta!')
      setOpen(false)
      setItens([])
      setClienteId('')
      setFormaPagamento('avista')
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Vendas</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Venda
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={v => setFormaPagamento(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avista">À Vista</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                    <SelectItem value="fiado">Fiado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <Label>Adicionar Produtos</Label>
              <div className="flex gap-2">
                <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos?.map(p => (
                      <SelectItem key={p.id} value={p.id} disabled={p.quantidade_estoque <= 0}>
                        {p.nome} - R$ {p.valor_venda.toFixed(2).replace('.', ',')} (estoque: {p.quantidade_estoque})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" className="w-20" value={qtdItem} onChange={e => setQtdItem(e.target.value)} />
                <Button type="button" onClick={addItem} disabled={!selectedProduto}>Add</Button>
              </div>

              {itens.length > 0 && (
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{item.qtd}</TableCell>
                        <TableCell>R$ {item.valor.toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>R$ {(item.valor * item.qtd).toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeItem(idx)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total: R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
                <span className="text-sm text-emerald-600">Lucro: R$ {totalLucro.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <Button className="w-full" disabled={itens.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
              Finalizar Venda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>
                ))
              ) : vendas?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma venda</TableCell></TableRow>
              ) : (
                vendas?.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{new Date(v.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{v.clientes?.nome || 'Cliente removido'}</TableCell>
                    <TableCell className="font-medium">R$ {Number(v.valor_total).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="text-emerald-600">R$ {Number(v.lucro_total).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>{v.forma_pagamento === 'avista' ? 'À Vista' : v.forma_pagamento === 'parcelado' ? 'Parcelado' : 'Fiado'}</TableCell>
                    <TableCell>
                      <Badge variant={v.status === 'concluida' ? 'success' : 'destructive'}>
                        {v.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  )
}
