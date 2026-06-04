'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Meta } from '@/types'

const metasSugeridas = [1000, 5000, 10000]

export default function MetasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ descricao: '', valor_meta: '', data_fim: '' })

  const { data: metas, isLoading } = useQuery({
    queryKey: ['metas'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['ativa', 'atingida'])
        .order('created_at', { ascending: false })
      return (data || []) as Meta[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('metas').insert({
        user_id: user.id,
        descricao: form.descricao,
        valor_meta: Number(form.valor_meta),
        valor_atual: 0,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: form.data_fim,
        status: 'ativa',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] })
      toast.success('Meta criada!')
      setOpen(false)
      setForm({ descricao: '', valor_meta: '', data_fim: '' })
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('metas').delete().eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas'] })
      toast.success('Meta excluída!')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Metas</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metasSugeridas.map(valor => (
          <Card key={valor} className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              setForm({
                descricao: `Meta de R$ ${valor.toFixed(2).replace('.', ',')}`,
                valor_meta: String(valor),
                data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              })
              setOpen(true)
            }}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meta rápida</p>
                <p className="text-xl font-bold">R$ {valor.toFixed(2).replace('.', ',')}</p>
              </div>
              <Target className="h-8 w-8 text-primary/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor da Meta</Label>
                <Input type="number" step="0.01" value={form.valor_meta} onChange={e => setForm(p => ({ ...p, valor_meta: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>Criar Meta</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : metas?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma meta cadastrada</p>
              <p className="text-sm">Crie sua primeira meta para começar</p>
            </CardContent>
          </Card>
        ) : (
          metas?.map(meta => {
            const progresso = meta.valor_meta > 0 ? (meta.valor_atual / meta.valor_meta) * 100 : 0
            return (
              <Card key={meta.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{meta.descricao}</h3>
                      <p className="text-sm text-muted-foreground">
                        Até {new Date(meta.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Progresso</p>
                        <p className="font-bold">R$ {Number(meta.valor_atual).toFixed(2).replace('.', ',')} / R$ {Number(meta.valor_meta).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <Badge variant={meta.status === 'atingida' ? 'success' : meta.status === 'cancelada' ? 'destructive' : 'warning'}>
                        {meta.status === 'ativa' ? 'Ativa' : meta.status === 'atingida' ? 'Atingida' : 'Cancelada'}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(meta.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progresso >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(progresso, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progresso.toFixed(1)}% concluído</p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
