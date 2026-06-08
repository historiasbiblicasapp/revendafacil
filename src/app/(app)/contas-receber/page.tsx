'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, MessageCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ContaReceber, Cliente } from '@/types'

export default function ContasReceberPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ cliente_id: '', valor: '', data_vencimento: '', observacao: '' })
  const [statusFilter, setStatusFilter] = useState('todas')

  const { data: contas, isLoading } = useQuery({
    queryKey: ['contas-receber', statusFilter],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      let query = supabase.from('contas_receber').select('*, clientes(nome)').eq('user_id', user.id).order('data_vencimento')
      if (statusFilter !== 'todas') query = query.eq('status', statusFilter)
      const { data } = await query
      return (data || []) as (ContaReceber & { clientes: { nome: string } | null })[]
    },
  })

  const { data: clientes } = useQuery({
    queryKey: ['clientes-cr'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user; if (!user) return []
      const { data } = await supabase.from('clientes').select('id, nome, whatsapp').eq('user_id', user.id).order('nome')
      return (data || []) as Pick<Cliente, 'id' | 'nome' | 'whatsapp'>[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('contas_receber').insert({
        user_id: user.id,
        cliente_id: form.cliente_id || null,
        valor: Number(form.valor),
        data_vencimento: form.data_vencimento,
        observacao: form.observacao,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
      toast.success('Conta cadastrada!')
      setOpen(false)
      setForm({ cliente_id: '', valor: '', data_vencimento: '', observacao: '' })
    },
    onError: (err) => toast.error(err.message),
  })

  const receberMutation = useMutation({
    mutationFn: async (conta: ContaReceber) => {
      const { error } = await supabase.from('contas_receber').update({
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0],
      }).eq('id', conta.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-receber'] })
      toast.success('Conta marcada como paga!')
    },
    onError: (err) => toast.error(err.message),
  })

  function cobrarWhats(conta: ContaReceber & { clientes: { nome: string } | null }) {
    const cliente = clientes?.find(c => c.id === conta.cliente_id)
    if (!cliente?.whatsapp) {
      toast.error('Cliente não possui WhatsApp cadastrado')
      return
    }
    const numero = cliente.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá ${cliente.nome}! 😊\n\n` +
      `Lembrando que você tem uma conta no valor de R$ ${Number(conta.valor).toFixed(2).replace('.', ',')} ` +
      `com vencimento em ${new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}.\n\n` +
      `Qualquer dúvida, estou à disposição!\n\nAtenciosamente, Revenda Fácil.`
    )
    window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank')
  }

  const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
    pago: 'success',
    pendente: 'warning',
    atrasado: 'destructive',
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Contas a Receber</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Conta
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="pago">Pagas</SelectItem>
            <SelectItem value="atrasado">Atrasadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta a Receber</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.cliente_id} onValueChange={v => setForm(p => ({ ...p, cliente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>Cadastrar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8" /></TableCell></TableRow>
                ))
              ) : contas?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta</TableCell></TableRow>
              ) : (
                contas?.map(conta => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">{conta.clientes?.nome || 'Cliente removido'}</TableCell>
                    <TableCell>R$ {Number(conta.valor).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>{new Date(conta.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{conta.data_pagamento ? new Date(conta.data_pagamento).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[conta.status]}>
                        {conta.status === 'pago' ? 'Pago' : conta.status === 'pendente' ? 'Pendente' : 'Atrasado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {conta.status !== 'pago' && (
                        <>
                          <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => receberMutation.mutate(conta)} title="Marcar como pago">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => cobrarWhats(conta)} title="Cobrar pelo WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
