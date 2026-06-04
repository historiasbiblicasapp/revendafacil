import { Sidebar } from '@/components/sidebar'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
