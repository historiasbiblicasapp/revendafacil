import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Percent, MessageCircle, Store } from 'lucide-react'
import type { Produto, Marca, Profile } from '@/types'

export default async function CatalogoPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!profile) notFound()

  const { data: produtos } = await supabase
    .from('produtos')
    .select('*, marcas(nome)')
    .eq('user_id', profile.id)
    .gt('quantidade_estoque', 0)
    .order('nome')

  const { data: marcas } = await supabase
    .from('marcas')
    .select('*')
    .eq('user_id', profile.id)
    .order('nome')

  const produtosAgrupados = marcas?.map(marca => ({
    marca,
    produtos: produtos?.filter(p => p.marca_id === marca.id) || [],
  })) || []

  const produtosSemMarca = produtos?.filter(p => !p.marca_id) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Percent className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">{profile.nome || 'Revenda'}</h1>
              {profile.cidade && (
                <p className="text-xs text-muted-foreground">{profile.cidade}</p>
              )}
            </div>
          </div>
          {profile.whatsapp && (
            <a
              href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Fale Conosco
            </a>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Catálogo de Produtos</h2>
          <p className="text-muted-foreground">Confira nossos produtos e faça seu pedido pelo WhatsApp</p>
        </div>

        {produtosAgrupados.map(({ marca, produtos: prods }) => prods.length > 0 && (
          <section key={marca.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Store className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-semibold">{marca.nome}</h3>
              <Badge variant="secondary">{prods.length} produtos</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {prods.map(prod => (
                <Card key={prod.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-8">
                    {prod.foto_url ? (
                      <img src={prod.foto_url} alt={prod.nome} className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-4xl font-bold text-primary/30">{prod.nome.charAt(0)}</div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">{prod.nome}</h4>
                    {prod.descricao && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{prod.descricao}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-lg font-bold text-primary">
                          R$ {Number(prod.valor_venda).toFixed(2).replace('.', ',')}
                        </p>
                        {prod.valor_compra > 0 && (
                          <p className="text-xs text-muted-foreground line-through">
                            R$ {Number(prod.valor_compra).toFixed(2).replace('.', ',')}
                          </p>
                        )}
                      </div>
                      {prod.quantidade_estoque <= 5 && (
                        <Badge variant="warning">{prod.quantidade_estoque} und.</Badge>
                      )}
                    </div>
                    {profile.whatsapp && (
                      <a
                        href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${prod.nome} - R$ ${Number(prod.valor_venda).toFixed(2).replace('.', ',')}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Comprar pelo WhatsApp
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}

        {produtosSemMarca.length > 0 && (
          <section className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Outros Produtos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produtosSemMarca.map(prod => (
                <Card key={prod.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-8">
                    <div className="text-4xl font-bold text-primary/30">{prod.nome.charAt(0)}</div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-1">{prod.nome}</h4>
                    <p className="text-lg font-bold text-primary">
                      R$ {Number(prod.valor_venda).toFixed(2).replace('.', ',')}
                    </p>
                    {profile.whatsapp && (
                      <a
                        href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${prod.nome} - R$ ${Number(prod.valor_venda).toFixed(2).replace('.', ',')}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-green-500 text-white text-sm py-2 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Comprar pelo WhatsApp
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(!produtos || produtos.length === 0) && (
          <div className="text-center py-20">
            <Store className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-medium text-muted-foreground">Nenhum produto disponível</h3>
            <p className="text-muted-foreground/60">Volte em breve para conferir nossas novidades</p>
          </div>
        )}
      </main>

      <footer className="border-t bg-white py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Revenda Fácil - {profile.nome || 'Catálogo'}</p>
      </footer>
    </div>
  )
}
