'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { FileText, FileSpreadsheet, Download } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function RelatoriosPage() {
  const supabase = createClient()
  const [tipoRelatorio, setTipoRelatorio] = useState('clientes')
  const [mes, setMes] = useState(new Date().toISOString().substring(0, 7))

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio', tipoRelatorio, mes],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) return null

      if (tipoRelatorio === 'clientes') {
        const { data } = await supabase.from('clientes').select('*').eq('user_id', user.id).order('nome')
        return { rows: data || [], columns: ['Nome', 'Telefone', 'WhatsApp', 'Cidade', 'Observações'] }
      }
      if (tipoRelatorio === 'produtos') {
        const { data } = await supabase.from('produtos').select('*, marcas(nome)').eq('user_id', user.id).order('nome')
        return { rows: data || [], columns: ['Nome', 'Código', 'Marca', 'Valor Compra', 'Valor Venda', 'Lucro', 'Estoque'] }
      }
      if (tipoRelatorio === 'estoque') {
        const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).lt('quantidade_estoque', 11).order('quantidade_estoque')
        return { rows: data || [], columns: ['Nome', 'Código', 'Estoque Atual', 'Valor Venda'] }
      }
      if (tipoRelatorio === 'vendas') {
        const { data } = await supabase
          .from('vendas')
          .select('*, clientes(nome)')
          .eq('user_id', user.id)
          .eq('status', 'concluida')
          .gte('created_at', `${mes}-01`)
          .lt('created_at', new Date(new Date(mes).getFullYear(), new Date(mes).getMonth() + 1, 1).toISOString().split('T')[0])
          .order('created_at', { ascending: false })
        return { rows: data || [], columns: ['Data', 'Cliente', 'Valor', 'Lucro', 'Pagamento'] }
      }
      if (tipoRelatorio === 'financeiro') {
        const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', user.id).eq('status', 'concluida')
        const { data: despesas } = await supabase.from('despesas').select('*').eq('user_id', user.id)
        return { rows: { vendas, despesas }, columns: ['Indicador', 'Valor'] }
      }
      if (tipoRelatorio === 'contas') {
        const { data } = await supabase.from('contas_receber').select('*, clientes(nome)').eq('user_id', user.id).order('data_vencimento')
        return { rows: data || [], columns: ['Cliente', 'Valor', 'Vencimento', 'Status'] }
      }
      return null
    },
  })

  function formatData(rows: any[], tipo: string) {
    if (!rows || rows.length === 0) return []
    if (tipo === 'clientes') return rows.map(r => [r.nome, r.telefone || '', r.whatsapp || '', r.cidade || '', r.observacoes || ''])
    if (tipo === 'produtos') return rows.map(r => [r.nome, r.codigo || '', r.marcas?.nome || '', `R$ ${Number(r.valor_compra).toFixed(2)}`, `R$ ${Number(r.valor_venda).toFixed(2)}`, `R$ ${Number(r.lucro_unitario).toFixed(2)}`, String(r.quantidade_estoque)])
    if (tipo === 'estoque') return rows.map(r => [r.nome, r.codigo || '', String(r.quantidade_estoque), `R$ ${Number(r.valor_venda).toFixed(2)}`])
    if (tipo === 'vendas') return rows.map(r => [new Date(r.created_at).toLocaleDateString('pt-BR'), r.clientes?.nome || '-', `R$ ${Number(r.valor_total).toFixed(2)}`, `R$ ${Number(r.lucro_total).toFixed(2)}`, r.forma_pagamento === 'avista' ? 'À Vista' : r.forma_pagamento === 'parcelado' ? 'Parcelado' : 'Fiado'])
    if (tipo === 'contas') return rows.map(r => [r.clientes?.nome || '-', `R$ ${Number(r.valor).toFixed(2)}`, new Date(r.data_vencimento).toLocaleDateString('pt-BR'), r.status === 'pago' ? 'Pago' : r.status === 'pendente' ? 'Pendente' : 'Atrasado'])
    return []
  }

  function gerarPDF() {
    if (!data?.rows || (Array.isArray(data.rows) && data.rows.length === 0)) {
      toast.error('Nenhum dado para gerar relatório')
      return
    }
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Revenda Fácil', 14, 22)
    doc.setFontSize(12)
    doc.text(`Relatório de ${tipoRelatorio.charAt(0).toUpperCase() + tipoRelatorio.slice(1)}`, 14, 32)

    if (!Array.isArray(data.rows)) {
      toast.error('Tipo de relatório não suportado para PDF')
      return
    }
    const rows = formatData(data.rows, tipoRelatorio)
    if (rows.length > 0) {
      ;(doc as any).autoTable({
        head: [data.columns],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 58, 237] },
      })
    }
    doc.save(`relatorio-${tipoRelatorio}-${mes}.pdf`)
    toast.success('PDF gerado!')
  }

  function gerarExcel() {
    if (!data?.rows || (Array.isArray(data.rows) && data.rows.length === 0)) {
      toast.error('Nenhum dado para gerar relatório')
      return
    }
    if (!Array.isArray(data.rows)) {
      toast.error('Tipo de relatório não suportado para Excel')
      return
    }
    const rows = formatData(data.rows, tipoRelatorio)
    const ws = XLSX.utils.aoa_to_sheet([data.columns, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')
    XLSX.writeFile(wb, `relatorio-${tipoRelatorio}-${mes}.xlsx`)
    toast.success('Excel gerado!')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold">Relatórios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clientes">Clientes</SelectItem>
                  <SelectItem value="produtos">Produtos</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="contas">Contas a Receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (para vendas)</label>
              <input type="month" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={mes} onChange={e => setMes(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={gerarPDF} className="flex-1">
                <FileText className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button onClick={gerarExcel} variant="outline" className="flex-1">
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : tipoRelatorio === 'financeiro' ? (
        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.rows && (
              <div className="space-y-2">
                <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                  <span>Total de Vendas</span>
                  <span className="font-bold text-green-600">
                    R$ {(data.rows as any).vendas?.reduce((a: number, v: any) => a + Number(v.valor_total), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                  <span>Total de Despesas</span>
                  <span className="font-bold text-red-600">
                    R$ {(data.rows as any).despesas?.reduce((a: number, d: any) => a + Number(d.valor), 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                  <span>Lucro Líquido</span>
                  <span className="font-bold text-purple-600">
                    R$ {((data.rows as any).vendas?.reduce((a: number, v: any) => a + Number(v.valor_total), 0) - (data.rows as any).despesas?.reduce((a: number, d: any) => a + Number(d.valor), 0)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {data?.columns.map((col: string) => (
                      <th key={col} className="h-10 px-4 text-left font-medium text-muted-foreground">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(data?.rows) && data.rows.length === 0 ? (
                    <tr><td colSpan={data?.columns.length} className="text-center py-8 text-muted-foreground">Nenhum dado encontrado</td></tr>
                  ) : (
                    formatData(Array.isArray(data?.rows) ? data.rows : [], tipoRelatorio).map((row: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        {row.map((cell: any, j: number) => (
                          <td key={j} className="p-4">{cell}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
