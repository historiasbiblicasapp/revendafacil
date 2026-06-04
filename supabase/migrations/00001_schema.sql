-- Revenda Fácil - Schema Completo do Banco de Dados
-- Migration: 00001_schema

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text,
  email text,
  telefone text,
  whatsapp text,
  endereco text,
  cidade text,
  logo_url text,
  cor_principal text default '#7c3aed',
  slug text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: clientes
-- ============================================================
create table if not exists clientes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  nome text not null,
  telefone text,
  whatsapp text,
  endereco text,
  cidade text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: marcas
-- ============================================================
create table if not exists marcas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  nome text not null,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: produtos
-- ============================================================
create table if not exists produtos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  nome text not null,
  codigo text,
  marca_id uuid references marcas(id) on delete set null,
  foto_url text,
  descricao text,
  valor_compra decimal(10,2) default 0,
  valor_venda decimal(10,2) default 0,
  lucro_unitario decimal(10,2) default 0,
  quantidade_estoque integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: movimentacoes_estoque
-- ============================================================
create table if not exists movimentacoes_estoque (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  produto_id uuid references produtos(id) on delete cascade not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  quantidade integer not null,
  motivo text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: vendas
-- ============================================================
create table if not exists vendas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  cliente_id uuid references clientes(id) on delete set null,
  valor_total decimal(10,2) default 0,
  lucro_total decimal(10,2) default 0,
  comissao decimal(10,2) default 0,
  forma_pagamento text check (forma_pagamento in ('avista', 'parcelado', 'fiado')),
  status text default 'concluida' check (status in ('concluida', 'cancelada')),
  observacoes text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: itens_venda
-- ============================================================
create table if not exists itens_venda (
  id uuid default uuid_generate_v4() primary key,
  venda_id uuid references vendas(id) on delete cascade not null,
  produto_id uuid references produtos(id) on delete set null,
  quantidade integer not null,
  valor_unitario decimal(10,2) not null,
  valor_total decimal(10,2) not null,
  lucro_unitario decimal(10,2) default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: contas_receber
-- ============================================================
create table if not exists contas_receber (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  cliente_id uuid references clientes(id) on delete set null,
  venda_id uuid references vendas(id) on delete set null,
  valor decimal(10,2) not null,
  data_vencimento date not null,
  data_pagamento date,
  status text default 'pendente' check (status in ('pendente', 'pago', 'atrasado')),
  observacao text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: despesas
-- ============================================================
create table if not exists despesas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  descricao text not null,
  categoria text not null check (categoria in ('compras', 'transporte', 'embalagens', 'marketing', 'outros')),
  valor decimal(10,2) not null,
  data date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: metas
-- ============================================================
create table if not exists metas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  descricao text not null,
  valor_meta decimal(10,2) not null,
  valor_atual decimal(10,2) default 0,
  data_inicio date not null,
  data_fim date not null,
  status text default 'ativa' check (status in ('ativa', 'atingida', 'cancelada')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: notificacoes
-- ============================================================
create table if not exists notificacoes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  titulo text not null,
  mensagem text not null,
  tipo text default 'info' check (tipo in ('info', 'alerta', 'sucesso', 'erro')),
  lida boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_clientes_user_id on clientes(user_id);
create index if not exists idx_marcas_user_id on marcas(user_id);
create index if not exists idx_produtos_user_id on produtos(user_id);
create index if not exists idx_produtos_marca_id on produtos(marca_id);
create index if not exists idx_movimentacoes_estoque_produto on movimentacoes_estoque(produto_id);
create index if not exists idx_vendas_user_id on vendas(user_id);
create index if not exists idx_vendas_cliente_id on vendas(cliente_id);
create index if not exists idx_itens_venda_venda on itens_venda(venda_id);
create index if not exists idx_contas_receber_user on contas_receber(user_id);
create index if not exists idx_contas_receber_cliente on contas_receber(cliente_id);
create index if not exists idx_contas_receber_status on contas_receber(status);
create index if not exists idx_despesas_user on despesas(user_id);
create index if not exists idx_metas_user on metas(user_id);
create index if not exists idx_notificacoes_user on notificacoes(user_id);

-- ============================================================
-- TRIGGER: Atualizar lucro_unitario em produtos
-- ============================================================
create or replace function atualizar_lucro_produto()
returns trigger as $$
begin
  new.lucro_unitario := new.valor_venda - new.valor_compra;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_atualizar_lucro on produtos;
create trigger trigger_atualizar_lucro
  before insert or update on produtos
  for each row
  execute function atualizar_lucro_produto();

-- ============================================================
-- TRIGGER: Baixar estoque ao criar itens_venda
-- ============================================================
create or replace function baixar_estoque()
returns trigger as $$
begin
  update produtos
  set quantidade_estoque = quantidade_estoque - new.quantidade
  where id = new.produto_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_baixar_estoque on itens_venda;
create trigger trigger_baixar_estoque
  after insert on itens_venda
  for each row
  execute function baixar_estoque();

-- ============================================================
-- TRIGGER: Atualizar contas_receber status automaticamente
-- ============================================================
create or replace function atualizar_status_conta()
returns trigger as $$
begin
  if new.data_pagamento is not null then
    new.status := 'pago';
  elsif new.data_vencimento < current_date then
    new.status := 'atrasado';
  else
    new.status := 'pendente';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_atualizar_status_conta on contas_receber;
create trigger trigger_atualizar_status_conta
  before insert or update on contas_receber
  for each row
  execute function atualizar_status_conta();

-- ============================================================
-- TRIGGER: Criar notificação automática para estoque baixo
-- ============================================================
create or replace function notificar_estoque_baixo()
returns trigger as $$
begin
  if new.quantidade_estoque <= 5 and new.quantidade_estoque > 0 then
    insert into notificacoes (user_id, titulo, mensagem, tipo)
    values (new.user_id, 'Estoque Baixo', 'O produto "' || new.nome || '" está com apenas ' || new.quantidade_estoque || ' unidades em estoque.', 'alerta');
  elsif new.quantidade_estoque <= 0 then
    insert into notificacoes (user_id, titulo, mensagem, tipo)
    values (new.user_id, 'Estoque Zerado', 'O produto "' || new.nome || '" está sem estoque.', 'erro');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_notificar_estoque on produtos;
create trigger trigger_notificar_estoque
  after update of quantidade_estoque on produtos
  for each row
  when (new.quantidade_estoque <= 5)
  execute function notificar_estoque_baixo();

-- ============================================================
-- TRIGGER: Notificar conta vencida
-- ============================================================
create or replace function notificar_conta_vencida()
returns trigger as $$
begin
  if new.status = 'atrasado' and (old.status is null or old.status != 'atrasado') then
    insert into notificacoes (user_id, titulo, mensagem, tipo)
    values (new.user_id, 'Conta Vencida', 'Uma conta no valor de R$ ' || new.valor || ' está vencida.', 'alerta');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_notificar_conta on contas_receber;
create trigger trigger_notificar_conta
  after update of status on contas_receber
  for each row
  when (new.status = 'atrasado')
  execute function notificar_conta_vencida();

-- ============================================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================================
create or replace function atualizar_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace function apply_updated_at_triggers() returns void as $$
declare
  tables text[] := array['profiles', 'clientes', 'marcas', 'produtos', 'contas_receber', 'despesas', 'metas'];
  t text;
begin
  foreach t in array tables
  loop
    execute format('drop trigger if exists trigger_updated_at on %I;', t);
    execute format('create trigger trigger_updated_at before update on %I for each row execute function atualizar_updated_at();', t);
  end loop;
end;
$$ language plpgsql;

select apply_updated_at_triggers();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table clientes enable row level security;
alter table marcas enable row level security;
alter table produtos enable row level security;
alter table movimentacoes_estoque enable row level security;
alter table vendas enable row level security;
alter table itens_venda enable row level security;
alter table contas_receber enable row level security;
alter table despesas enable row level security;
alter table metas enable row level security;
alter table notificacoes enable row level security;

-- Políticas: cada usuário vê apenas seus próprios dados

-- CLIENTES
create policy "Usuários podem ver próprios clientes"
  on clientes for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprios clientes"
  on clientes for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios clientes"
  on clientes for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios clientes"
  on clientes for delete using (auth.uid() = user_id);

-- MARCAS
create policy "Usuários podem ver próprias marcas"
  on marcas for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias marcas"
  on marcas for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias marcas"
  on marcas for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias marcas"
  on marcas for delete using (auth.uid() = user_id);

-- PRODUTOS
create policy "Usuários podem ver próprios produtos"
  on produtos for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprios produtos"
  on produtos for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprios produtos"
  on produtos for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprios produtos"
  on produtos for delete using (auth.uid() = user_id);

-- MOVIMENTAÇÕES ESTOQUE
create policy "Usuários podem ver próprias movimentações"
  on movimentacoes_estoque for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias movimentações"
  on movimentacoes_estoque for insert with check (auth.uid() = user_id);

-- VENDAS
create policy "Usuários podem ver próprias vendas"
  on vendas for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias vendas"
  on vendas for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias vendas"
  on vendas for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias vendas"
  on vendas for delete using (auth.uid() = user_id);

-- ITENS VENDA
create policy "Usuários podem ver itens das próprias vendas"
  on itens_venda for select using (
    exists (select 1 from vendas where vendas.id = itens_venda.venda_id and vendas.user_id = auth.uid())
  );
create policy "Usuários podem inserir itens nas próprias vendas"
  on itens_venda for insert with check (
    exists (select 1 from vendas where vendas.id = itens_venda.venda_id and vendas.user_id = auth.uid())
  );

-- CONTAS A RECEBER
create policy "Usuários podem ver próprias contas"
  on contas_receber for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias contas"
  on contas_receber for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias contas"
  on contas_receber for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias contas"
  on contas_receber for delete using (auth.uid() = user_id);

-- DESPESAS
create policy "Usuários podem ver próprias despesas"
  on despesas for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias despesas"
  on despesas for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias despesas"
  on despesas for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias despesas"
  on despesas for delete using (auth.uid() = user_id);

-- METAS
create policy "Usuários podem ver próprias metas"
  on metas for select using (auth.uid() = user_id);
create policy "Usuários podem inserir próprias metas"
  on metas for insert with check (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias metas"
  on metas for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias metas"
  on metas for delete using (auth.uid() = user_id);

-- NOTIFICAÇÕES
create policy "Usuários podem ver próprias notificações"
  on notificacoes for select using (auth.uid() = user_id);
create policy "Usuários podem atualizar próprias notificações"
  on notificacoes for update using (auth.uid() = user_id);
create policy "Usuários podem deletar próprias notificações"
  on notificacoes for delete using (auth.uid() = user_id);

-- PROFILES: qualquer um pode ver (público para catálogo), mas só o dono edita
create policy "Perfis são públicos para visualização"
  on profiles for select using (true);
create policy "Usuários podem inserir próprio perfil"
  on profiles for insert with check (auth.uid() = id);
create policy "Usuários podem atualizar próprio perfil"
  on profiles for update using (auth.uid() = id);
