'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { LogOut, Save, User, Share2, ExternalLink, Clock, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

export default function ConfiguracoesPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [form, setForm] = useState({
    nome: '', telefone: '', whatsapp: '', endereco: '', cidade: '', slug: '',
  })

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return null
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return data as Profile | null
    },
  })

  useEffect(() => {
    if (profile) {
      setForm({
        nome: profile.nome || '',
        telefone: profile.telefone || '',
        whatsapp: profile.whatsapp || '',
        endereco: profile.endereco || '',
        cidade: profile.cidade || '',
        slug: profile.slug || '',
      })
    }
  }, [profile])

  const mutation = useMutation({
    mutationFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...form,
        email: user.email,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Configurações salvas!')
    },
    onError: (err) => toast.error(err.message),
  })

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate() }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Slug do Catálogo</Label>
                <Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
                  placeholder="meu-catalogo" />
                {form.slug && (
                  <p className="text-xs text-muted-foreground">
                    Catálogo: /catalogo/{form.slug}
                  </p>
                )}
                {form.slug && (
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => window.open(`/catalogo/${form.slug}`, '_blank')}>
                      <ExternalLink className="h-3 w-3 mr-1" /> Visualizar
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => {
                      const url = `${window.location.origin}/catalogo/${form.slug}`
                      window.open(`https://wa.me/?text=${encodeURIComponent(`Olá! Confira meu catálogo de produtos:\n${url}`)}`, '_blank')
                    }}>
                      <Share2 className="h-3 w-3 mr-1" /> Compartilhar no WhatsApp
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={mutation.isPending}>
              <Save className="h-4 w-4 mr-2" /> Salvar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" /> Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profile && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plano atual</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  (profile as any).plano === 'premium' ? 'bg-green-100 text-green-700' :
                  (profile as any).plano === 'bloqueado' ? 'bg-red-100 text-red-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {(profile as any).plano || 'gratuito'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expira em</span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-4 w-4 text-orange-500" />
                  {(profile as any).data_expiracao
                    ? new Date((profile as any).data_expiracao).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
              </div>
              {profile.email === 'admin@revendafacil.com' && (
                <a
                  href="/admin/assinaturas"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium mt-2"
                >
                  <Shield className="h-4 w-4" /> Gerenciar assinaturas
                </a>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Sair da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full md:w-auto" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
