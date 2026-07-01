import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const protectedRoutes = [
  '/dashboard', '/clientes', '/marcas', '/produtos', '/estoque',
  '/vendas', '/contas-receber', '/despesas', '/financeiro',
  '/relatorios', '/metas', '/configuracoes', '/admin',
]

const authRoutes = ['/login', '/cadastro', '/recuperar-senha']

const adminEmail = 'admin@revendafacil.com'

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedRoutes.some(route => path.startsWith(route))
  const isAuth = authRoutes.some(route => path.startsWith(route))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuth && user) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  if (isProtected && user && user.email !== adminEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('data_expiracao')
      .eq('id', user.id)
      .single()

    if (profile?.data_expiracao && new Date(profile.data_expiracao) < new Date()) {
      return NextResponse.redirect(new URL('/assinatura-expirada', req.nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|catalogo|planos|.*\\.png$).*)'],
}
