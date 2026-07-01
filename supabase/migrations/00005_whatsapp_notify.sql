create extension if not exists pg_net;

create or replace function notify_admin_new_signup()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://revendafacil-liard.vercel.app/api/notify-cadastro',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', current_setting('app.webhook_secret', true)
    ),
    body := jsonb_build_object(
      'type', 'new_signup',
      'record', row_to_json(new)
    )
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_profile_notify on profiles;
create trigger on_new_profile_notify
  after insert on profiles
  for each row
  execute function notify_admin_new_signup();
