-- Adicionar coluna de expiração de assinatura
alter table profiles add column if not exists data_expiracao timestamptz;
alter table profiles add column if not exists plano text default 'gratuito';
