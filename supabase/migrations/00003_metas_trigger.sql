-- ============================================================
-- TRIGGER: Atualizar metas automaticamente ao criar venda
-- ============================================================

create or replace function atualizar_meta_com_venda()
returns trigger as $$
begin
  update metas
  set valor_atual = valor_atual + new.valor_total,
      status = case
        when (valor_atual + new.valor_total) >= valor_meta then 'atingida'
        else status
      end
  where user_id = new.user_id
    and status = 'ativa'
    and new.created_at >= data_inicio
    and new.created_at <= (data_fim + interval '1 day');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_atualizar_meta on vendas;
create trigger trigger_atualizar_meta
  after insert on vendas
  for each row
  when (new.status = 'concluida')
  execute function atualizar_meta_com_venda();

-- ============================================================
-- TRIGGER: Reverter meta ao cancelar venda
-- ============================================================

create or replace function reverter_meta_venda()
returns trigger as $$
begin
  update metas
  set valor_atual = greatest(0, valor_atual - old.valor_total),
      status = 'ativa'
  where user_id = old.user_id
    and status = 'atingida'
    and old.created_at >= data_inicio
    and old.created_at <= (data_fim + interval '1 day');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_reverter_meta on vendas;
create trigger trigger_reverter_meta
  after update of status on vendas
  for each row
  when (old.status = 'concluida' and new.status = 'cancelada')
  execute function reverter_meta_venda();
