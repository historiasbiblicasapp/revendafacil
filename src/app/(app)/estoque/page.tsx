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
import { Plus, ArrowUpDown, AlertTriangle, Package } from 'lucide-react'
import { toast } from 'sonner'
import type { Produto, MovimentacaoEstoque } from '@/types'

export default function EstoquePage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState('')
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos-estoque'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome')
      return (data || []) as Produto[]
    },
  })

  const { data: movimentacoes } = useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase
        .from('movimentacoes_estoque')
        .select('*, produtos(nome)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      return (data || []) as (MovimentacaoEstoque & { produtos: { nome: string } })[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      const qtd = Number(quantidade)
      if (!selectedProduto || qtd <= 0) throw new Error('Selecione um produto e informe a quantidade')

      const { error } = await supabase.from('movimentacoes_estoque').insert({
        user_id: user.id,
        produto_id: selectedProduto,
        tipo,
        quantidade: tipo === 'saida' ? -qtd : qtd,
        motivo,
      })
      if (error) throw error

      const produto = produtos?.find(p => p.id === selectedProduto)
      const novaQtd = tipo === 'entrada'
        ? (produto?.quantidade_estoque || 0) + qtd
        : (produto?.quantidade_estoque || 0) - qtd

      await supabase.from('produtos').update({ quantidade_estoque: novaQtd }).eq('id', selectedProduto)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-estoque'] })
      queryClient.invalidateQueries({ queryKey: ['movimentacoes'] })
      toast.success('Movimentação registrada!')
      setOpen(false)
      setSelectedProduto('')
      setQuantidade('')
      setMotivo('')
    },
    onError: (err) => toast.error(err.message),
  })

  const estoqueBaixo = produtos?.filter(p => p.quantidade_estoque <= 5 && p.quantidade_estoque > 0) || []
  const estoqueZerado = produtos?.filter(p => p.quantidade_estoque <= 0) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estoque</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Movimentar Estoque
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{produtos?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{estoqueBaixo.length}</p>
          </CardContent>
        </Card>
        <Card className="border-red-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Estoque Zerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{estoqueZerado.length}</p>
          </CardContent>
        </Card>
      </div>

      {estoqueBaixo.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="text-yellow-600 text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {estoqueBaixo.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium">{p.nome}</span>
                  </div>
                  <Badge variant="warning">{p.quantidade_estoque} unid.</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} (estoque: {p.quantidade_estoque})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={v => setTipo(v as 'entrada' | 'saida')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Compra, venda, ajuste..." />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              Registrar Movimentação
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes?.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{m.produtos?.nome}</TableCell>
                  <TableCell>
                    <Badge variant={m.tipo === 'entrada' ? 'success' : 'destructive'}>
                      {m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell>{Math.abs(m.quantidade)}</TableCell>
                  <TableCell>{m.motivo || '-'}</TableCell>
                </TableRow>
              ))}
              {(!movimentacoes || movimentacoes.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma movimentação</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
