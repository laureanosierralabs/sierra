-- Existing business module only. Never duplicate the already paid USD 500 maintenance.
-- Guard exact verified references and durable quote UUID, including repeat applications.
begin;
do $$
declare quote_id uuid := 'd19f9f8b-0a99-41ac-b723-01e779b02501';
begin
 if exists(select 1 from clients where id='02f2c4eb-738f-4e70-8b5d-ec94ce398804' and company='Wonder Digital Agency')
 and exists(select 1 from projects where id='e89b1690-15fe-4585-9553-5662bb8eb02e' and client_id='02f2c4eb-738f-4e70-8b5d-ec94ce398804')
 and not exists(select 1 from quotes where client_id='02f2c4eb-738f-4e70-8b5d-ec94ce398804' and (id=quote_id or (currency='USD' and total_amount=250 and lower(title) like '%extra%'))) then
 insert into quotes(id,client_id,title,service,total_amount,currency,commercial_status,payment_status,notes)
 values(quote_id,'02f2c4eb-738f-4e70-8b5d-ec94ce398804','Wonder · Horas extras pendientes','Horas extras',250,'USD','approved','pending','Importe aproximado informado por Laureano. Cuenta por cobrar de Landing Pages, no ingreso ni crédito personal. Confirmar importe exacto.');
 insert into quote_projects(quote_id,project_id) values(quote_id,'e89b1690-15fe-4585-9553-5662bb8eb02e') on conflict do nothing;
 end if;
end $$;
comment on column movements.related_business is 'Manual personal withdrawal link only. No business revenue import. Future business reserve/distribution remains independent.';
commit;
