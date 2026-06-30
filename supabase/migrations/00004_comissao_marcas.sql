alter table marcas add column if not exists comissao_percentual decimal(5,2) default 0;

create or replace function atualizar_lucro_produto()
returns trigger as $$
declare
  v_comissao decimal(5,2);
begin
  if new.marca_id is not null then
    select comissao_percentual into v_comissao
    from marcas where id = new.marca_id;
    if v_comissao > 0 then
      new.lucro_unitario := new.valor_venda * (v_comissao / 100);
    else
      new.lucro_unitario := new.valor_venda - new.valor_compra;
    end if;
  else
    new.lucro_unitario := new.valor_venda - new.valor_compra;
  end if;
  return new;
end;
$$ language plpgsql;
