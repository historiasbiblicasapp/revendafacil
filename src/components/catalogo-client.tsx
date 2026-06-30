'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Produto, Marca } from '@/types'

const brandStyle: Record<string, { cor: string; emoji: string }> = {
  natura: { cor: '#f97316', emoji: '🌿' },
  avon: { cor: '#ec4899', emoji: '💄' },
  'o boticário': { cor: '#14b8a6', emoji: '🧴' },
  eudora: { cor: '#8b5cf6', emoji: '✨' },
  jequiti: { cor: '#ef4444', emoji: '🌟' },
}

function brandInfo(nome: string) {
  const key = nome.toLowerCase()
  return brandStyle[key] || { cor: '#7c3aed', emoji: '🏷️' }
}

function calcDesc(venda: number, compra: number) {
  if (!compra || compra <= 0) return 0
  return Math.round((1 - venda / compra) * 100)
}

function Product3DCard({ prod, whatsapp, marcaNome, idx }: { prod: Produto; whatsapp: string | null; marcaNome?: string; idx: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { cor, emoji } = marcaNome ? brandInfo(marcaNome) : { cor: '#7c3aed', emoji: '🏷️' }
  const desconto = calcDesc(Number(prod.valor_venda), Number(prod.valor_compra))
  const wppMsg = encodeURIComponent(
    `Olá! Tenho interesse: ${prod.nome}${prod.codigo ? ` (${prod.codigo})` : ''} - R$ ${Number(prod.valor_venda).toFixed(2).replace('.', ',')}`
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)'
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer group opacity-0 animate-fadeIn"
      style={{
        animation: `fadeIn 0.5s ease-out ${idx * 0.04}s forwards`,
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
      }}
    >
      <div className="relative w-full h-44 sm:h-52 overflow-hidden" style={{ background: `linear-gradient(135deg, ${cor}15, ${cor}30, ${cor}08)` }}>
        {prod.foto_url ? (
          <img src={prod.foto_url} alt={prod.nome} className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl sm:text-7xl opacity-30 group-hover:scale-125 transition-transform duration-500">{emoji}</span>
          </div>
        )}
        {desconto > 0 && (
          <div className="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-rose-600 text-white text-[0.6rem] sm:text-xs font-bold px-2 py-1 rounded-lg shadow-md">
            -{desconto}%
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 mb-1.5">
          {marcaNome && (
            <span className="text-[0.6rem] sm:text-xs font-bold px-2 py-0.5 rounded text-white flex items-center gap-1" style={{ background: cor }}>
              <span>{emoji}</span> {marcaNome}
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm sm:text-base leading-tight mb-0.5">{prod.nome}</h3>
        {prod.descricao && (
          <p className="text-[0.7rem] sm:text-xs text-gray-400 line-clamp-2 mb-2 flex-1 leading-relaxed">{prod.descricao}</p>
        )}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-xl sm:text-2xl font-black" style={{ color: '#6d28d9' }}>
            R${Number(prod.valor_venda).toFixed(2).replace('.', ',')}
          </span>
          {prod.valor_compra > 0 && (
            <span className="text-[0.65rem] sm:text-xs text-gray-400 line-through">
              R${Number(prod.valor_compra).toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
        {prod.codigo && <p className="text-[0.6rem] text-gray-300 mb-2">Cód: {prod.codigo}</p>}
        {whatsapp && (
          <a
            href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${wppMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#25d366] to-[#1da851] text-white text-xs sm:text-sm font-bold py-2 sm:py-2.5 rounded-xl hover:from-[#22c35e] hover:to-[#189d46] transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.137.56 4.146 1.537 5.896L0 24l6.337-1.523A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.823 0-3.583-.496-5.093-1.425l-.365-.214-3.84.924.932-3.619-.237-.374A9.54 9.54 0 012.4 12c0-5.301 4.299-9.6 9.6-9.6s9.6 4.299 9.6 9.6-4.299 9.6-9.6 9.6z"/>
              <path d="M17.287 13.775c-.25-.125-1.474-.725-1.7-.807-.228-.083-.393-.125-.56.125-.165.25-.645.807-.79.973-.146.165-.292.185-.54.06-.25-.125-1.052-.387-2.002-1.237-.74-.663-1.24-1.48-1.385-1.73-.145-.25-.015-.385.11-.51.11-.11.25-.293.375-.44.125-.147.166-.25.25-.415.083-.165.042-.31-.02-.435-.062-.125-.56-1.35-.767-1.85-.202-.488-.406-.422-.56-.43-.145-.008-.31-.008-.476-.008s-.435.062-.663.31c-.228.25-.87.85-.87 2.073 0 1.225.89 2.406 1.015 2.573.125.166 1.75 2.675 4.242 3.753.592.256 1.054.41 1.414.525.594.19 1.134.164 1.562.1.476-.072 1.474-.602 1.682-1.185.208-.583.208-1.082.146-1.186-.06-.104-.22-.166-.47-.29z"/>
            </svg>
            Comprar
          </a>
        )}
      </div>
    </div>
  )
}

function FloatingShapes() {
  const shapes = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: 20 + Math.random() * 60,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 8,
      color: ['#7c3aed33', '#6366f133', '#3b82f133', '#ec489933', '#f9731633', '#14b8a633'][i],
      radius: [50, 20, 40, 10, 30, 60][i],
    }))
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map(s => (
        <div
          key={s.id}
          className="absolute animate-float"
          style={{
            width: s.size, height: s.size, left: `${s.left}%`,
            top: `${20 + Math.random() * 60}%`, background: s.color,
            borderRadius: s.radius, animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function CatalogoClient({ produtos, marcas, profile }: {
  produtos: (Produto & { marcas?: { nome: string } | null })[]
  marcas: Marca[]
  profile: { id: string; nome: string | null; whatsapp: string | null; cidade: string | null }
}) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const [showFloatingWA, setShowFloatingWA] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowFloatingWA(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const grupos = useMemo(() => {
    const g = marcas.map(m => ({ marca: m, produtos: produtos.filter(p => p.marca_id === m.id) })).filter(g => g.produtos.length > 0)
    return { grupos: g, semMarca: produtos.filter(p => !p.marca_id) }
  }, [produtos, marcas])

  const filtrados = useMemo(() => {
    let ativos = grupos
    if (filtro !== 'todos') {
      if (filtro === 'sem-marca') ativos = { grupos: [], semMarca: grupos.semMarca }
      else ativos = { grupos: grupos.grupos.filter(g => g.marca.id === filtro), semMarca: [] }
    }
    if (!busca.trim()) return ativos
    const t = busca.toLowerCase()
    return {
      grupos: ativos.grupos.map(g => ({ ...g, produtos: g.produtos.filter(p => p.nome.toLowerCase().includes(t) || (p.descricao || '').toLowerCase().includes(t)) })).filter(g => g.produtos.length > 0),
      semMarca: ativos.semMarca.filter(p => p.nome.toLowerCase().includes(t) || (p.descricao || '').toLowerCase().includes(t)),
    }
  }, [filtro, busca, grupos])

  const total = filtrados.grupos.reduce((a, g) => a + g.produtos.length, 0) + filtrados.semMarca.length

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-30px) rotate(10deg); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { scrollbar-width: none; }
      `}</style>

      {produtos.length > 0 && (
        <>
          <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 shadow-lg shadow-purple-900/5">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 space-y-2.5">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text" placeholder="🔍 Buscar produtos..." value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-gray-100 bg-gray-50/80 text-sm focus:outline-none focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-100 transition-all"
                />
                {busca && (
                  <button onClick={() => setBusca('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors text-sm font-bold">✕</button>
                )}
              </div>
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scroll-hide pb-0.5">
                {[
                  { id: 'todos', label: '✨ Todos', qtd: produtos.length, cor: '#7c3aed' },
                  ...marcas.map(m => ({ id: m.id, label: `${brandInfo(m.nome).emoji} ${m.nome}`, qtd: produtos.filter(p => p.marca_id === m.id).length, cor: brandInfo(m.nome).cor })),
                  ...(grupos.semMarca.length > 0 ? [{ id: 'sem-marca', label: '📦 Outros', qtd: grupos.semMarca.length, cor: '#7c3aed' }] : []),
                ].filter(item => item.qtd > 0).map(item => (
                  <button key={item.id} onClick={() => setFiltro(item.id)}
                    className={`flex-shrink-0 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap ${filtro === item.id ? 'text-white shadow-lg' : 'bg-gray-100/80 text-gray-500 hover:bg-gray-200'}`}
                    style={filtro === item.id ? { background: item.cor, boxShadow: `0 4px 12px ${item.cor}44` } : {}}
                  >
                    {item.label}
                    <span className="ml-1 opacity-70">({item.qtd})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-10">
            {total === 0 ? (
              <div className="text-center py-20">
                <span className="text-6xl">🔍</span>
                <h3 className="text-xl font-bold text-gray-500 mt-4">Nada aqui</h3>
                <p className="text-sm text-gray-400 mt-1">Nenhum produto com esse nome</p>
                <button onClick={() => { setBusca(''); setFiltro('todos') }} className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-semibold underline underline-offset-4">Limpar filtros</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">
                    {filtro === 'todos' ? `📋 ${produtos.length} ${produtos.length === 1 ? 'produto' : 'produtos'}` : `📋 ${total} encontrado${total !== 1 ? 's' : ''}`}
                  </p>
                  {(filtro !== 'todos' || busca) && (
                    <button onClick={() => { setBusca(''); setFiltro('todos') }} className="text-xs text-purple-500 hover:text-purple-700 font-semibold transition-colors">✕ Limpar</button>
                  )}
                </div>

                {filtrados.grupos.map(({ marca, produtos: prods }) => prods.length > 0 && (
                  <section key={marca.id} className="mb-8 sm:mb-12">
                    <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                      <span className="text-xl sm:text-2xl">{brandInfo(marca.nome).emoji}</span>
                      <h2 className="text-lg sm:text-2xl font-black text-gray-800">{marca.nome}</h2>
                      <span className="text-[0.65rem] sm:text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{prods.length}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-5">
                      {prods.map((prod, i) => (
                        <Product3DCard key={prod.id} prod={prod} whatsapp={profile.whatsapp} marcaNome={marca.nome} idx={i} />
                      ))}
                    </div>
                  </section>
                ))}

                {filtrados.semMarca.length > 0 && (
                  <section className="mb-8 sm:mb-12">
                    <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
                      <span className="text-xl sm:text-2xl">📦</span>
                      <h2 className="text-lg sm:text-2xl font-black text-gray-800">Outros Produtos</h2>
                      <span className="text-[0.65rem] sm:text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filtrados.semMarca.length}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-5">
                      {filtrados.semMarca.map((prod, i) => (
                        <Product3DCard key={prod.id} prod={prod} whatsapp={profile.whatsapp} idx={i} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </>
      )}

      {produtos.length === 0 && (
        <main className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-center">
            <span className="text-7xl">📦</span>
            <h2 className="text-2xl font-bold text-gray-500 mt-5">Em breve</h2>
            <p className="text-sm text-gray-400 mt-1">Novos produtos estão chegando!</p>
          </div>
        </main>
      )}

      {profile.whatsapp && showFloatingWA && (
        <a href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-30 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#25d366] to-[#1da851] rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 hover:shadow-[#25d366]/40"
          style={{ boxShadow: '0 8px 32px rgba(37,211,102,0.35)' }}>
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.137.56 4.146 1.537 5.896L0 24l6.337-1.523A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.823 0-3.583-.496-5.093-1.425l-.365-.214-3.84.924.932-3.619-.237-.374A9.54 9.54 0 012.4 12c0-5.301 4.299-9.6 9.6-9.6s9.6 4.299 9.6 9.6-4.299 9.6-9.6 9.6z"/>
            <path d="M17.287 13.775c-.25-.125-1.474-.725-1.7-.807-.228-.083-.393-.125-.56.125-.165.25-.645.807-.79.973-.146.165-.292.185-.54.06-.25-.125-1.052-.387-2.002-1.237-.74-.663-1.24-1.48-1.385-1.73-.145-.25-.015-.385.11-.51.11-.11.25-.293.375-.44.125-.147.166-.25.25-.415.083-.165.042-.31-.02-.435-.062-.125-.56-1.35-.767-1.85-.202-.488-.406-.422-.56-.43-.145-.008-.31-.008-.476-.008s-.435.062-.663.31c-.228.25-.87.85-.87 2.073 0 1.225.89 2.406 1.015 2.573.125.166 1.75 2.675 4.242 3.753.592.256 1.054.41 1.414.525.594.19 1.134.164 1.562.1.476-.072 1.474-.602 1.682-1.185.208-.583.208-1.082.146-1.186-.06-.104-.22-.166-.47-.29z"/>
          </svg>
        </a>
      )}
    </>
  )
}
