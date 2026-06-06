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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Trash2, MessageCircle, History } from 'lucide-react'
import { toast } from 'sonner'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nome: '', telefone: '', whatsapp: '', endereco: '', cidade: '', observacoes: '' })

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes', search],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      let query = supabase.from('clientes').select('*').eq('user_id', user.id).order('nome')
      if (search) query = query.ilike('nome', `%${search}%`)
      const { data } = await query
      return (data || []) as Cliente[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      if (editing) {
        const { error } = await supabase.from('clientes').update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clientes').insert({ ...form, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente cadastrado!')
      setOpen(false)
      setEditing(null)
      setForm({ nome: '', telefone: '', whatsapp: '', endereco: '', cidade: '', observacoes: '' })
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente excluído!')
    },
    onError: (err) => toast.error(err.message),
  })

  function openEdit(cliente: Cliente) {
    setEditing(cliente)
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      whatsapp: cliente.whatsapp || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      observacoes: cliente.observacoes || '',
    })
    setOpen(true)
  }

  function openNew() {
    setEditing(null)
    setForm({ nome: '', telefone: '', whatsapp: '', endereco: '', cidade: '', observacoes: '' })
    setOpen(true)
  }

  function enviarWhats(whatsapp: string) {
    if (!whatsapp) return
    const numero = whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/55${numero}`, '_blank')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {editing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Pesquisar clientes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>
                ))
              ) : clientes?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
              ) : (
                clientes?.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>
                      {cliente.whatsapp && (
                        <Button variant="ghost" size="sm" className="text-green-600" onClick={() => enviarWhats(cliente.whatsapp!)}>
                          <MessageCircle className="h-4 w-4 mr-1" /> {cliente.whatsapp}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{cliente.cidade}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cliente)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(cliente.id)}>
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
