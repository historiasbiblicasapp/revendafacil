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
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Despesa } from '@/types'

const categorias = [
  { value: 'compras', label: 'Compras' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'embalagens', label: 'Embalagens' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'outros', label: 'Outros' },
]

export default function DespesasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ descricao: '', categoria: 'outros', valor: '', data: new Date().toISOString().split('T')[0] })

  const { data: despesas, isLoading } = useQuery({
    queryKey: ['despesas'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase.from('despesas').select('*').eq('user_id', user.id).order('data', { ascending: false }).limit(50)
      return (data || []) as Despesa[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('despesas').insert({
        user_id: user.id,
        descricao: form.descricao,
        categoria: form.categoria,
        valor: Number(form.valor),
        data: form.data,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      toast.success('Despesa cadastrada!')
      setOpen(false)
      setForm({ descricao: '', categoria: 'outros', valor: '', data: new Date().toISOString().split('T')[0] })
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('despesas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas'] })
      toast.success('Despesa excluída!')
    },
  })

  const totalMes = despesas?.filter(d =>
    d.data.startsWith(new Date().toISOString().split('T')[0].substring(0, 7))
  ).reduce((acc, d) => acc + Number(d.valor), 0) || 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Despesas</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">Total do mês: <span className="font-bold text-red-600">R$ {totalMes.toFixed(2).replace('.', ',')}</span></p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Despesa
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(p => ({ ...p, categoria: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} required />
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
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>
                ))
              ) : despesas?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma despesa</TableCell></TableRow>
              ) : (
                despesas?.map(d => (
                  <TableRow key={d.id}>
                    <TableCell>{new Date(d.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{d.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{categorias.find(c => c.value === d.categoria)?.label}</Badge>
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">- R$ {Number(d.valor).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
