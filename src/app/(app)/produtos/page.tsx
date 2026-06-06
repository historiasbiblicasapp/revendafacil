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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Trash2, Package, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Produto, Marca } from '@/types'

export default function ProdutosPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [marcaFilter, setMarcaFilter] = useState('todas')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [form, setForm] = useState({
    nome: '', codigo: '', marca_id: 'sem-marca', descricao: '',
    valor_compra: '', valor_venda: '', quantidade_estoque: '',
  })

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos', search, marcaFilter],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      let query = supabase.from('produtos').select('*, marcas(nome)').eq('user_id', user.id).order('nome')
      if (search) query = query.ilike('nome', `%${search}%`)
      if (marcaFilter && marcaFilter !== 'todas') query = query.eq('marca_id', marcaFilter)
      const { data } = await query
      return (data || []) as (Produto & { marcas: { nome: string } | null })[]
    },
  })

  const { data: marcas } = useQuery({
    queryKey: ['marcas-select'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase.from('marcas').select('id, nome').eq('user_id', user.id)
      return (data || []) as Pick<Marca, 'id' | 'nome'>[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      const payload = {
        nome: form.nome,
        codigo: form.codigo,
        marca_id: form.marca_id === 'sem-marca' ? null : form.marca_id,
        descricao: form.descricao,
        valor_compra: Number(form.valor_compra) || 0,
        valor_venda: Number(form.valor_venda) || 0,
        quantidade_estoque: Number(form.quantidade_estoque) || 0,
      }
      if (editing) {
        const { error } = await supabase.from('produtos').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('produtos').insert({ ...payload, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success(editing ? 'Produto atualizado!' : 'Produto cadastrado!')
      setOpen(false)
      resetForm()
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] })
      toast.success('Produto excluído!')
    },
    onError: (err) => toast.error(err.message),
  })

  function resetForm() {
    setEditing(null)
    setForm({ nome: '', codigo: '', marca_id: '', descricao: '', valor_compra: '', valor_venda: '', quantidade_estoque: '' })
  }

  function openEdit(produto: Produto) {
    setEditing(produto)
    setForm({
      nome: produto.nome,
      codigo: produto.codigo || '',
      marca_id: produto.marca_id || 'sem-marca',
      descricao: produto.descricao || '',
      valor_compra: String(produto.valor_compra),
      valor_venda: String(produto.valor_venda),
      quantidade_estoque: String(produto.quantidade_estoque),
    })
    setOpen(true)
  }

  function shareWhatsApp(prod: Produto & { marcas: { nome: string } | null }) {
    const texto = `*${prod.nome}*\n💰 R$ ${Number(prod.valor_venda).toFixed(2).replace('.', ',')}${prod.marcas?.nome ? `\n📦 ${prod.marcas.nome}` : ''}${prod.codigo ? ` | Cód: ${prod.codigo}` : ''}${prod.descricao ? `\n\n${prod.descricao}` : ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={form.marca_id} onValueChange={v => setForm(p => ({ ...p, marca_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-marca">Sem marca</SelectItem>
                    {marcas?.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor Compra</Label>
                  <Input type="number" step="0.01" value={form.valor_compra} onChange={e => setForm(p => ({ ...p, valor_compra: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Valor Venda</Label>
                  <Input type="number" step="0.01" value={form.valor_venda} onChange={e => setForm(p => ({ ...p, valor_venda: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque</Label>
                  <Input type="number" value={form.quantidade_estoque} onChange={e => setForm(p => ({ ...p, quantidade_estoque: e.target.value }))} />
                </div>
              </div>
              {form.valor_compra && form.valor_venda && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Lucro Unitário: </span>
                  <span className="font-medium text-emerald-600">
                    R$ {(Number(form.valor_venda) - Number(form.valor_compra)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
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
          <Input className="pl-9" placeholder="Pesquisar produtos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={marcaFilter} onValueChange={setMarcaFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as marcas</SelectItem>
            {marcas?.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Compra</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8" /></TableCell></TableRow>
                ))
              ) : produtos?.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum produto encontrado</TableCell></TableRow>
              ) : (
                produtos?.map((prod) => (
                  <TableRow key={prod.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {prod.nome}
                      </div>
                    </TableCell>
                    <TableCell>{prod.codigo}</TableCell>
                    <TableCell>{prod.marcas?.nome || '-'}</TableCell>
                    <TableCell>R$ {Number(prod.valor_compra).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>R$ {Number(prod.valor_venda).toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                      <Badge variant={prod.lucro_unitario > 0 ? 'success' : 'destructive'}>
                        R$ {Number(prod.lucro_unitario).toFixed(2).replace('.', ',')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prod.quantidade_estoque <= 5 ? 'destructive' : prod.quantidade_estoque <= 10 ? 'warning' : 'secondary'}>
                        {prod.quantidade_estoque}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-green-600" onClick={() => shareWhatsApp(prod)} title="Compartilhar no WhatsApp">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(prod)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(prod.id)}>
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
