import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CatalogoClient from '@/components/catalogo-client'

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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #e0e7ff 100%)' }}>
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6)' }}>
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 60%)',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <style>{`@keyframes float { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-30px)} }`}</style>
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative z-10 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
              🛍️ {profile.nome || 'Catálogo'}
            </h1>
            {profile.cidade && (
              <p className="text-white/80 mt-1 text-sm sm:text-base">{profile.cidade}</p>
            )}
            <span className="inline-block mt-3 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
              📸 Catálogo Digital
            </span>
          </div>
          {profile.whatsapp && (
            <a
              href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-white/30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.137.56 4.146 1.537 5.896L0 24l6.337-1.523A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.823 0-3.583-.496-5.093-1.425l-.365-.214-3.84.924.932-3.619-.237-.374A9.54 9.54 0 012.4 12c0-5.301 4.299-9.6 9.6-9.6s9.6 4.299 9.6 9.6-4.299 9.6-9.6 9.6z"/>
                <path d="M17.287 13.775c-.25-.125-1.474-.725-1.7-.807-.228-.083-.393-.125-.56.125-.165.25-.645.807-.79.973-.146.165-.292.185-.54.06-.25-.125-1.052-.387-2.002-1.237-.74-.663-1.24-1.48-1.385-1.73-.145-.25-.015-.385.11-.51.11-.11.25-.293.375-.44.125-.147.166-.25.25-.415.083-.165.042-.31-.02-.435-.062-.125-.56-1.35-.767-1.85-.202-.488-.406-.422-.56-.43-.145-.008-.31-.008-.476-.008s-.435.062-.663.31c-.228.25-.87.85-.87 2.073 0 1.225.89 2.406 1.015 2.573.125.166 1.75 2.675 4.242 3.753.592.256 1.054.41 1.414.525.594.19 1.134.164 1.562.1.476-.072 1.474-.602 1.682-1.185.208-.583.208-1.082.146-1.186-.06-.104-.22-.166-.47-.29z"/>
              </svg>
              Fale Conosco
            </a>
          )}
        </div>
      </header>

      <CatalogoClient
        produtos={produtos || []}
        marcas={marcas || []}
        profile={{ id: profile.id, nome: profile.nome, whatsapp: profile.whatsapp, cidade: profile.cidade }}
      />

      <footer className="border-t bg-white/80 py-6 text-center text-xs sm:text-sm text-gray-400">
        <p>&copy; {new Date().getFullYear()} Revenda Fácil — {profile.nome || 'Catálogo Digital'}</p>
      </footer>
    </div>
  )
}
