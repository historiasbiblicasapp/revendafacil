'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { Marca } from '@/types'

export default function MarcasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Marca | null>(null)
  const [nome, setNome] = useState('')

  const { data: marcas, isLoading } = useQuery({
    queryKey: ['marcas'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return []
      const { data } = await supabase.from('marcas').select('*').eq('user_id', user.id).order('nome')
      return (data || []) as Marca[]
    },
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      if (editing) {
        const { error } = await supabase.from('marcas').update({ nome }).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('marcas').insert({ nome, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      toast.success(editing ? 'Marca atualizada!' : 'Marca cadastrada!')
      setOpen(false)
      setEditing(null)
      setNome('')
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marcas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marcas'] })
      toast.success('Marca excluída!')
    },
    onError: (err) => toast.error(err.message),
  })

  const marcasPadrao = ['Natura', 'Avon', 'Jequiti', 'Eudora', 'Boticário', 'Mary Kay', 'Hinode']

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Marcas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setNome('') }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Marca
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Marca' : 'Nova Marca'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Marca</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {editing ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {marcasPadrao.filter(m => !marcas?.some(mr => mr.nome === m)).map(marca => (
          <Card key={marca} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => { setNome(marca); setEditing(null); setOpen(true) }}>
            <CardContent className="p-6 flex items-center gap-3">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{marca}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Suas Marcas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : marcas?.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma marca cadastrada</p>
          ) : (
            marcas?.map(marca => (
              <Card key={marca.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-primary" />
                      <span className="font-medium">{marca.nome}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(marca); setNome(marca.nome); setOpen(true) }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(marca.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
