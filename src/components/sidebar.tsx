'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Tags, Package, Warehouse, ShoppingCart,
  Receipt, Wallet, BarChart3, Target, Settings, Menu, X,
  FileText, Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/marcas', label: 'Marcas', icon: Tags },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/estoque', label: 'Estoque', icon: Warehouse },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/contas-receber', label: 'Contas a Receber', icon: Receipt },
  { href: '/despesas', label: 'Despesas', icon: Wallet },
  { href: '/financeiro', label: 'Financeiro', icon: BarChart3 },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300",
        "w-64",
        "max-lg:-translate-x-full",
        open && "max-lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Percent className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Revenda Fácil</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
