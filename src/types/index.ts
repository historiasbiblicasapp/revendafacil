export interface Profile {
  id: string
  nome: string | null
  email: string | null
  telefone: string | null
  whatsapp: string | null
  endereco: string | null
  cidade: string | null
  logo_url: string | null
  cor_principal: string | null
  slug: string | null
  data_expiracao: string | null
  plano: string | null
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  user_id: string
  nome: string
  telefone: string | null
  whatsapp: string | null
  endereco: string | null
  cidade: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Marca {
  id: string
  user_id: string
  nome: string
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  user_id: string
  nome: string
  codigo: string | null
  marca_id: string | null
  marca?: Marca | null
  foto_url: string | null
  descricao: string | null
  valor_compra: number
  valor_venda: number
  lucro_unitario: number
  quantidade_estoque: number
  created_at: string
  updated_at: string
}

export interface MovimentacaoEstoque {
  id: string
  user_id: string
  produto_id: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  motivo: string | null
  created_at: string
}

export interface Venda {
  id: string
  user_id: string
  cliente_id: string | null
  cliente?: Cliente | null
  valor_total: number
  lucro_total: number
  comissao: number
  forma_pagamento: 'avista' | 'parcelado' | 'fiado'
  status: 'concluida' | 'cancelada'
  observacoes: string | null
  itens?: ItemVenda[]
  created_at: string
}

export interface ItemVenda {
  id: string
  venda_id: string
  produto_id: string | null
  produto?: Produto | null
  quantidade: number
  valor_unitario: number
  valor_total: number
  lucro_unitario: number
  created_at: string
}

export interface ContaReceber {
  id: string
  user_id: string
  cliente_id: string | null
  cliente?: Cliente | null
  venda_id: string | null
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: 'pendente' | 'pago' | 'atrasado'
  observacao: string | null
  created_at: string
  updated_at: string
}

export interface Despesa {
  id: string
  user_id: string
  descricao: string
  categoria: 'compras' | 'transporte' | 'embalagens' | 'marketing' | 'outros'
  valor: number
  data: string
  created_at: string
  updated_at: string
}

export interface Meta {
  id: string
  user_id: string
  descricao: string
  valor_meta: number
  valor_atual: number
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'atingida' | 'cancelada'
  created_at: string
  updated_at: string
}

export interface Notificacao {
  id: string
  user_id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'alerta' | 'sucesso' | 'erro'
  lida: boolean
  created_at: string
}
