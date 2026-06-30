'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Shield, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminAssinaturasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user || user.email !== 'admin@revendafacil.com') {
        router.push('/dashboard')
        return []
      }
      const { data: authUsers, error } = await supabase.auth.admin.listUsers()
      if (error) throw error
      const userIds = authUsers.users.map(u => u.id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {} as Record<string, any>)
      return authUsers.users.map(u => ({
        id: u.id,
        email: u.email,
        nome: profileMap[u.id]?.nome || '',
        data_expiracao: profileMap[u.id]?.data_expiracao || null,
        plano: profileMap[u.id]?.plano || 'gratuito',
        created_at: u.created_at,
      })).filter(u => u.email !== 'admin@revendafacil.com')
    },
  })

  const extendMutation = useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const exp = new Date()
      exp.setDate(exp.getDate() + days)
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, data_expiracao: exp.toISOString(), plano: 'premium' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Assinatura estendida!')
    },
    onError: (err) => toast.error(err.message),
  })

  const blockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, data_expiracao: new Date(0).toISOString(), plano: 'bloqueado' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Usuário bloqueado!')
    },
    onError: (err) => toast.error(err.message),
  })

  function isExpired(dataExpiracao: string | null) {
    if (!dataExpiracao) return true
    return new Date(dataExpiracao) < new Date()
  }

  function daysRemaining(dataExpiracao: string | null) {
    if (!dataExpiracao) return 0
    const diff = new Date(dataExpiracao).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  if (isLoading) return <div className="space-y-6 max-w-7xl mx-auto"><Skeleton className="h-96 rounded-xl" /></div>

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6 text-purple-600" /> Gerenciar Assinaturas
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {users && users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum usuário cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Nome</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Plano</th>
                    <th className="pb-3 font-medium">Expira em</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => {
                    const expired = isExpired(u.data_expiracao)
                    const days = daysRemaining(u.data_expiracao)
                    return (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{u.nome || '—'}</td>
                        <td className="py-3 text-muted-foreground">{u.email}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.plano === 'premium' ? 'bg-green-100 text-green-700' :
                            u.plano === 'bloqueado' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {u.plano}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {u.data_expiracao
                            ? new Date(u.data_expiracao).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="py-3">
                          {expired ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                              <XCircle className="h-4 w-4" /> Expirado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircle className="h-4 w-4" /> {days}d ativo
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extendMutation.mutate({ userId: u.id, days: 7 })}
                              disabled={extendMutation.isPending}
                            >
                              <Clock className="h-3 w-3 mr-1" /> +7 dias
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => extendMutation.mutate({ userId: u.id, days: 30 })}
                              disabled={extendMutation.isPending}
                            >
                              <Plus className="h-3 w-3 mr-1" /> +30 dias
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => blockMutation.mutate(u.id)}
                              disabled={blockMutation.isPending}
                            >
                              Bloquear
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
