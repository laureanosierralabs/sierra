-- Additive personal ledger. All entry points use Clerk-authorized service_role.
begin;
create table finance_accounts (
 id uuid primary key default gen_random_uuid(), owner_id text not null,
 name text not null check(length(trim(name)) between 1 and 120), currency text not null check(currency in ('USD','ARS')),
 opening_balance numeric(14,2) not null default 0, account_type text, active boolean not null default true,
 description text, request_id uuid, created_at timestamptz not null default now(), unique(owner_id,request_id), unique(id,owner_id), unique(id,owner_id,currency)
);
create table finance_categories (
 id uuid primary key default gen_random_uuid(), owner_id text not null, name text not null check(length(trim(name)) between 1 and 120),
 kind text not null check(kind in ('ingreso','egreso')), active boolean not null default true,
 created_at timestamptz not null default now(), unique(id,owner_id), unique(owner_id,kind,name)
);
create table exchange_rates (
 owner_id text primary key, rate numeric(14,4) check(rate>0), quoted_at timestamptz,
 source text, manual boolean not null default false, seed_version integer not null default 0,
 updated_at timestamptz not null default now()
);
create table finance_schedules (
 id uuid primary key default gen_random_uuid(), owner_id text not null,
 name text not null check(length(trim(name)) between 1 and 160), kind text not null check(kind in ('income','expense','subscription')),
 amount numeric(14,2) check(amount>0), currency text not null check(currency in ('USD','ARS')),
 account_id uuid, category_id uuid, frequency text not null default 'monthly' check(frequency in ('monthly','yearly','once','custom')),
 interval_days integer check(interval_days>0), next_date date, period_end date,
 status text not null default 'active' check(status in ('active','paused','cancelled','incomplete','paid')),
 origin text not null default 'Personal', description text, created_at timestamptz not null default now(), unique(id,owner_id),
 foreign key(account_id,owner_id,currency) references finance_accounts(id,owner_id,currency),
 foreign key(category_id,owner_id) references finance_categories(id,owner_id),
 check(frequency<>'custom' or interval_days is not null)
);
create table finance_obligations (
 id uuid primary key default gen_random_uuid(), owner_id text not null,
 kind text not null check(kind in ('debt','receivable')), counterparty text not null check(length(trim(counterparty))>0),
 name text not null check(length(trim(name))>0), amount numeric(14,2) check(amount>0), currency text not null check(currency in ('USD','ARS')),
 priority text not null default 'medium' check(priority in ('low','medium','medium-high','high')),
 target_date date, target_month text check(target_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 status text not null default 'pending' check(status in ('pending','negotiating','installments','paid','cancelled','partial','collected','uncollectible','review')),
 allocation_known boolean not null default true, installments integer check(installments>0), monthly_payment numeric(14,2) check(monthly_payment>0),
 next_date date, next_month text check(next_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 installment_anchor_date date, installment_anchor_month text check(installment_anchor_month ~ '^\d{4}-(0[1-9]|1[0-2])$'), description text,
 created_at timestamptz not null default now(), unique(id,owner_id)
);
create table finance_goals (
 id uuid primary key default gen_random_uuid(), owner_id text not null,
 name text not null check(length(trim(name))>0), kind text not null default 'savings' check(kind in ('savings','income')),
 amount numeric(14,2) not null check(amount>0), currency text not null check(currency in ('USD','ARS')),
 target_date date, account_id uuid, status text not null default 'active' check(status in ('active','completed','paused','cancelled')),
 description text, created_at timestamptz not null default now(), unique(id,owner_id),
 foreign key(account_id,owner_id,currency) references finance_accounts(id,owner_id,currency)
);
create table finance_goal_milestones (
 id uuid primary key default gen_random_uuid(), owner_id text not null, goal_id uuid not null,
 name text not null check(length(trim(name))>0), amount numeric(14,2) not null check(amount>0),
 target_date date, target_month text check(target_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 status text not null default 'active' check(status in ('active','completed','cancelled')), description text,
 created_at timestamptz not null default now(), unique(id,owner_id),
 foreign key(goal_id,owner_id) references finance_goals(id,owner_id) on delete cascade
);
create table finance_goal_contributions (
 id uuid primary key default gen_random_uuid(), owner_id text not null, goal_id uuid not null, account_id uuid not null,
 amount numeric(14,2) not null check(amount>0), currency text not null check(currency in ('USD','ARS')), contributed_on date not null,
 description text, request_id uuid, created_at timestamptz not null default now(), unique(owner_id,request_id), unique(id,owner_id),
 foreign key(goal_id,owner_id) references finance_goals(id,owner_id),
 foreign key(account_id,owner_id,currency) references finance_accounts(id,owner_id,currency)
);
alter table movements
 add column owner_id text,
 add column account_id uuid,
 add column category_id uuid,
 add column origin text,
 add column recurring boolean not null default false,
 add column related_business text references context_units(slug),
 add column related_project uuid references projects(id),
 add column related_context_project text references context_projects(slug),
 add column exchange_rate numeric(14,4) check(exchange_rate>0),
 add column exchange_quoted_at timestamptz,
 add column usd_amount numeric(14,4),
 add column obligation_id uuid,
 add column schedule_id uuid,
 add column occurrence_date date,
 add column cancelled_at timestamptz,
 add column request_id uuid,
 add constraint movements_account_owner_fk foreign key(account_id,owner_id,moneda) references finance_accounts(id,owner_id,currency),
 add constraint movements_category_owner_fk foreign key(category_id,owner_id) references finance_categories(id,owner_id),
 add constraint movements_obligation_owner_fk foreign key(obligation_id,owner_id) references finance_obligations(id,owner_id),
 add constraint movements_schedule_owner_fk foreign key(schedule_id,owner_id) references finance_schedules(id,owner_id);
create unique index movements_request_idx on movements(owner_id,request_id) where request_id is not null;
create unique index movements_occurrence_idx on movements(owner_id,schedule_id,occurrence_date) where schedule_id is not null and cancelled_at is null;
create index movements_owner_date_idx on movements(owner_id,fecha) where ambito='personal';
create index movements_account_idx on movements(account_id) where ambito='personal';
do $$ declare t text; begin
 foreach t in array array['finance_accounts','finance_categories','exchange_rates','finance_schedules','finance_obligations','finance_goals','finance_goal_milestones','finance_goal_contributions'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public, anon, authenticated',t);
 execute format('grant all on %I to service_role',t);
 end loop;
end $$;

-- Derive the next monthly installment from its original period and active payments.
-- Month-only dates remain month-only; split payments advance only at full thresholds.
create function finance_recalculate_installment(p_owner text,p_id uuid)
returns void language plpgsql set search_path=public,pg_temp as $$
declare plan finance_obligations; paid_total numeric; completed integer;
begin
 select * into plan from finance_obligations where id=p_id and owner_id=p_owner for update;
 if plan.id is null or plan.kind<>'debt' or plan.monthly_payment is null then return; end if;
 select coalesce(sum(m.monto),0) into paid_total from movements m where m.obligation_id=p_id and m.owner_id=p_owner and m.cancelled_at is null and m.estado in ('pagado','cobrado');
 completed:=floor(paid_total/plan.monthly_payment)::integer;
 update finance_obligations set
  next_date=case when plan.installment_anchor_date is not null then (plan.installment_anchor_date+completed*interval '1 month')::date else plan.next_date end,
  next_month=case when plan.installment_anchor_month is not null then to_char(to_date(plan.installment_anchor_month||'-01','YYYY-MM-DD')+completed*interval '1 month','YYYY-MM') else plan.next_month end
 where id=p_id and owner_id=p_owner;
end $$;
revoke all on function finance_recalculate_installment(text,uuid) from public,anon,authenticated,service_role;

-- One transaction, one owner lock: ledger, payments and reservations cannot race.
create function finance_mutate(p_owner text,p_entity text,p_operation text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 t text; oldrow jsonb; rowdata jsonb; result jsonb; rowid uuid; mid text;
 a finance_accounts; o finance_obligations; s finance_schedules; g finance_goals;
 payment_amount numeric; paid numeric; cash numeric; reserved numeric; rate numeric; currency text; day date;
begin
 if p_owner is null or length(p_owner)=0 then raise exception 'Owner required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('finance:'||p_owner,0));
 if p_operation not in ('save','delete','pay','cancel') then raise exception 'Invalid operation'; end if;
 if p_entity='movement' or p_operation='pay' then
  mid := coalesce(nullif(p_data->>'id',''),gen_random_uuid()::text);
  select to_jsonb(m) into oldrow from movements m where m.id=mid and m.owner_id=p_owner and m.ambito='personal' for update;
  if p_operation in ('delete','cancel') then
   if oldrow is null then raise exception 'Movement not found'; end if;
   update movements set cancelled_at=now() where id=mid and owner_id=p_owner;
   if oldrow->>'schedule_id' is not null then
    update finance_schedules set next_date=(oldrow->>'occurrence_date')::date,status='active' where id=(oldrow->>'schedule_id')::uuid and owner_id=p_owner and not exists(select 1 from movements m where m.schedule_id=(oldrow->>'schedule_id')::uuid and m.cancelled_at is null and m.occurrence_date>(oldrow->>'occurrence_date')::date);
   end if;
   if oldrow->>'obligation_id' is not null then
    select * into o from finance_obligations where id=(oldrow->>'obligation_id')::uuid and owner_id=p_owner;
    select coalesce(sum(monto),0) into paid from movements where obligation_id=o.id and owner_id=p_owner and cancelled_at is null;
    update finance_obligations set status=case when paid=0 then 'pending' when o.kind='debt' then 'installments' else 'partial' end where id=o.id and status not in ('cancelled','uncollectible');
    perform finance_recalculate_installment(p_owner,o.id);
   end if;
   return jsonb_build_object('id',mid);
  end if;
  if p_operation='save' and oldrow is not null and (oldrow->>'obligation_id' is not null or oldrow->>'schedule_id' is not null or oldrow->>'cancelled_at' is not null) then raise exception 'Linked or cancelled movement: cancel instead'; end if;
  if p_data->>'request_id' is not null then
   select to_jsonb(m) into result from movements m where owner_id=p_owner and request_id=(p_data->>'request_id')::uuid;
   if result is not null then return result; end if;
  end if;
  if p_operation='pay' and exists(select 1 from movements where id=mid) then raise exception 'Payment cannot overwrite an existing movement'; end if;
  payment_amount := (p_data->>'monto')::numeric; currency:=p_data->>'moneda'; day:=(p_data->>'fecha')::date;
  if payment_amount is null or payment_amount<=0 or payment_amount<>round(payment_amount,2) or day is null then raise exception 'Invalid amount/date'; end if;
  select * into a from finance_accounts where id=(p_data->>'account_id')::uuid and owner_id=p_owner for update;
  if a.id is null or not a.active or a.currency<>currency then raise exception 'Invalid account/currency'; end if;
  if p_operation='pay' then
   if p_entity='obligation' then
    select * into o from finance_obligations where id=(p_data->>'obligation_id')::uuid and owner_id=p_owner for update;
    if o.id is null or o.currency<>currency or o.status in ('cancelled','uncollectible','paid','collected') then raise exception 'Invalid obligation'; end if;
    select coalesce(sum(monto),0) into paid from movements where obligation_id=o.id and owner_id=p_owner and cancelled_at is null;
    if o.amount is not null and paid+payment_amount>o.amount then raise exception 'Payment exceeds outstanding balance'; end if;
    p_data:=p_data||jsonb_build_object('tipo',case when o.kind='debt' then 'egreso' else 'ingreso' end,'concepto',o.name,'categoria',case when o.kind='debt' then 'Pago de deuda' else 'Cobro personal' end,'estado',case when o.kind='debt' then 'pagado' else 'cobrado' end);
   elsif p_entity='schedule' then
    select * into s from finance_schedules where id=(p_data->>'schedule_id')::uuid and owner_id=p_owner for update;
    if s.id is null or s.currency<>currency or s.status not in ('active','incomplete') then raise exception 'Invalid schedule'; end if;
    p_data:=p_data||jsonb_build_object('tipo',case when s.kind='income' then 'ingreso' else 'egreso' end,'concepto',s.name,'categoria',coalesce((select name from finance_categories where id=s.category_id),'Otros'),'estado',case when s.kind='income' then 'cobrado' else 'pagado' end,'occurrence_date',coalesce(s.next_date,day),'category_id',s.category_id,'origin',s.origin);
   else raise exception 'Invalid payment entity'; end if;
  elsif p_entity<>'movement' then raise exception 'Invalid entity'; end if;
  if p_data->>'tipo' not in ('ingreso','egreso') or p_data->>'estado' not in ('pagado','cobrado','pendiente') or length(trim(coalesce(p_data->>'concepto','')))=0 then raise exception 'Invalid movement'; end if;
  rate:=(p_data->>'exchange_rate')::numeric;
  if currency='ARS' and (rate is null or rate<=0 or p_data->>'exchange_quoted_at' is null) then raise exception 'ARS requires historical quote'; end if;
  if p_data->>'category_id' is not null and not exists(select 1 from finance_categories where id=(p_data->>'category_id')::uuid and owner_id=p_owner and kind=p_data->>'tipo') then raise exception 'Invalid category'; end if;
  if p_operation='save' and p_data->>'category_id' is null then
   insert into finance_categories(owner_id,name,kind) values(p_owner,p_data->>'categoria',p_data->>'tipo') on conflict(owner_id,kind,name) do nothing;
   p_data:=p_data||jsonb_build_object('category_id',(select id from finance_categories where owner_id=p_owner and kind=p_data->>'tipo' and name=p_data->>'categoria'));
  end if;
  insert into movements(id,fecha,ambito,tipo,monto,moneda,categoria,concepto,estado,notas,owner_id,account_id,category_id,origin,recurring,related_business,related_project,related_context_project,exchange_rate,exchange_quoted_at,usd_amount,obligation_id,schedule_id,occurrence_date,request_id)
  values(mid,day,'personal',p_data->>'tipo',payment_amount,currency,coalesce(p_data->>'categoria','Otros'),p_data->>'concepto',p_data->>'estado',p_data->>'notas',p_owner,a.id,(p_data->>'category_id')::uuid,coalesce(p_data->>'origin','Personal'),coalesce((p_data->>'recurring')::boolean,false),p_data->>'related_business',(p_data->>'related_project')::uuid,p_data->>'related_context_project',case when currency='ARS' then rate end,(p_data->>'exchange_quoted_at')::timestamptz,case when currency='USD' then payment_amount else payment_amount/rate end,o.id,s.id,(p_data->>'occurrence_date')::date,(p_data->>'request_id')::uuid)
  on conflict(id) do update set fecha=excluded.fecha,tipo=excluded.tipo,monto=excluded.monto,moneda=excluded.moneda,categoria=excluded.categoria,concepto=excluded.concepto,estado=excluded.estado,notas=excluded.notas,account_id=excluded.account_id,category_id=excluded.category_id,origin=excluded.origin,recurring=excluded.recurring,related_business=excluded.related_business,related_project=excluded.related_project,related_context_project=excluded.related_context_project,exchange_rate=excluded.exchange_rate,exchange_quoted_at=excluded.exchange_quoted_at,usd_amount=excluded.usd_amount
  where movements.owner_id=p_owner and movements.ambito='personal' returning to_jsonb(movements.*) into result;
  if result is null then raise exception 'Movement not found'; end if;
  if o.id is not null then
   update finance_obligations set status=case when o.amount is not null and paid+payment_amount=o.amount then case when o.kind='debt' then 'paid' else 'collected' end else case when o.kind='debt' then 'installments' else 'partial' end end,
    installment_anchor_date=case when o.kind='debt' and o.monthly_payment is not null then coalesce(o.installment_anchor_date,o.next_date) else o.installment_anchor_date end,
    installment_anchor_month=case when o.kind='debt' and o.monthly_payment is not null then coalesce(o.installment_anchor_month,o.next_month) else o.installment_anchor_month end
   where id=o.id;
   perform finance_recalculate_installment(p_owner,o.id);
  end if;
  if s.id is not null then update finance_schedules set status=case when frequency='once' then 'paid' else 'active' end,next_date=case frequency when 'once' then null when 'monthly' then ((coalesce(s.next_date,day)+interval '1 month')::date) when 'yearly' then ((coalesce(s.next_date,day)+interval '1 year')::date) else coalesce(s.next_date,day)+interval_days end where id=s.id; end if;
  return result;
 end if;
 t:=case p_entity when 'account' then 'finance_accounts' when 'category' then 'finance_categories' when 'schedule' then 'finance_schedules' when 'obligation' then 'finance_obligations' when 'goal' then 'finance_goals' when 'milestone' then 'finance_goal_milestones' when 'contribution' then 'finance_goal_contributions' end;
 if t is null then raise exception 'Invalid entity'; end if;
 if p_entity in ('account','contribution') and p_data->>'request_id' is not null and p_data->>'id' is null then
  execute format('select to_jsonb(t) from %I t where request_id=$1 and owner_id=$2',t) into result using (p_data->>'request_id')::uuid,p_owner;
  if result is not null then return result; end if;
 end if;
 rowid:=coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());
 execute format('select to_jsonb(t) from %I t where id=$1 and owner_id=$2 for update',t) into oldrow using rowid,p_owner;
 if p_operation='delete' then
  if oldrow is null then raise exception 'Not found'; end if;
  if p_entity='obligation' and exists(select 1 from movements where obligation_id=rowid and owner_id=p_owner) then raise exception 'Preserve payment history: cancel instead'; end if;
  if p_entity='schedule' and exists(select 1 from movements where schedule_id=rowid and owner_id=p_owner) then raise exception 'Preserve history: cancel instead'; end if;
  execute format('delete from %I where id=$1 and owner_id=$2',t) using rowid,p_owner;
  return jsonb_build_object('id',rowid);
 end if;
 if p_operation<>'save' then raise exception 'Invalid operation'; end if;
 rowdata:=coalesce(oldrow,'{}'::jsonb)||p_data||jsonb_build_object('id',rowid,'owner_id',p_owner,'created_at',coalesce(oldrow->>'created_at',now()::text));
 -- Defaults must be explicit for populate_record, which otherwise produces nulls.
 rowdata:=case p_entity
 when 'account' then jsonb_build_object('active',true,'opening_balance',0)||rowdata
 when 'category' then jsonb_build_object('active',true)||rowdata
 when 'schedule' then rowdata||jsonb_build_object('frequency',coalesce(nullif(rowdata->>'frequency',''),'monthly'),'status',coalesce(nullif(rowdata->>'status',''),'active'),'origin',coalesce(nullif(rowdata->>'origin',''),'Personal'))
 when 'obligation' then jsonb_build_object('allocation_known',true)||rowdata||jsonb_build_object('priority',coalesce(nullif(rowdata->>'priority',''),'medium'),'status',coalesce(nullif(rowdata->>'status',''),'pending'))
 when 'goal' then rowdata||jsonb_build_object('kind',coalesce(nullif(rowdata->>'kind',''),'savings'),'status',coalesce(nullif(rowdata->>'status',''),'active'))
 when 'milestone' then rowdata||jsonb_build_object('status',coalesce(nullif(rowdata->>'status',''),'active')) else rowdata end;
 if p_entity='account' and oldrow is not null and (oldrow->>'currency')<>(rowdata->>'currency') and (exists(select 1 from movements where account_id=rowid) or exists(select 1 from finance_goal_contributions where account_id=rowid)) then raise exception 'Account currency has history'; end if;
 if p_entity='category' and oldrow is not null and oldrow->>'kind'<>rowdata->>'kind' and (exists(select 1 from movements where category_id=rowid) or exists(select 1 from finance_schedules where category_id=rowid)) then raise exception 'Category type has history'; end if;
 if p_entity='schedule' and rowdata->>'category_id' is not null and not exists(select 1 from finance_categories where id=(rowdata->>'category_id')::uuid and owner_id=p_owner and kind=case when rowdata->>'kind'='income' then 'ingreso' else 'egreso' end) then raise exception 'Invalid schedule category'; end if;
 if p_entity='goal' and oldrow is not null and (oldrow->>'currency'<>rowdata->>'currency' or oldrow->>'kind'<>rowdata->>'kind') and exists(select 1 from finance_goal_contributions where goal_id=rowid and owner_id=p_owner) then raise exception 'Goal currency/type has contributions'; end if;
 if p_entity='obligation' then
  if oldrow is not null and exists(select 1 from movements where obligation_id=rowid and owner_id=p_owner) and (
   (oldrow->>'monthly_payment')::numeric is distinct from (rowdata->>'monthly_payment')::numeric or
   (oldrow->>'next_date')::date is distinct from (rowdata->>'next_date')::date or
   oldrow->>'next_month' is distinct from rowdata->>'next_month'
  ) then raise exception 'Installment amount and next period cannot change after payment history (including cancelled payments)'; end if;
  select coalesce(sum(monto),0) into paid from movements where obligation_id=rowid and owner_id=p_owner and cancelled_at is null;
  if paid>0 and (oldrow->>'currency'<>rowdata->>'currency' or oldrow->>'kind'<>rowdata->>'kind' or (rowdata->>'amount')::numeric<paid) then raise exception 'Obligation conflicts with payment history'; end if;
  if rowdata->>'status' not in ('cancelled','uncollectible') then
   if paid>0 then rowdata:=rowdata||jsonb_build_object('status',case when (rowdata->>'amount')::numeric=paid then case when rowdata->>'kind'='debt' then 'paid' else 'collected' end else case when rowdata->>'kind'='debt' then 'installments' else 'partial' end end);
   elsif rowdata->>'status' in ('paid','collected','partial') then raise exception 'Payment status must match ledger history'; end if;
  end if;
 end if;
 if p_entity='contribution' then
  select * into g from finance_goals where id=(rowdata->>'goal_id')::uuid and owner_id=p_owner;
  select * into a from finance_accounts where id=(rowdata->>'account_id')::uuid and owner_id=p_owner;
  if g.id is null or g.kind<>'savings' or g.currency<>a.currency or a.currency<>rowdata->>'currency' or not a.active then raise exception 'Invalid savings allocation'; end if;
  select a.opening_balance+coalesce(sum(case when tipo='ingreso' then monto else -monto end),0) into cash from movements where account_id=a.id and owner_id=p_owner and cancelled_at is null and estado in ('pagado','cobrado');
  select coalesce(sum(amount),0) into reserved from finance_goal_contributions where account_id=a.id and owner_id=p_owner and id<>rowid;
  if reserved+(rowdata->>'amount')::numeric>cash then raise exception 'Allocation exceeds available cash'; end if;
 end if;
 -- Field names come only from the catalog of an allowlisted table; values stay parameters.
 execute format('insert into %1$I select (jsonb_populate_record(null::%1$I,$1)).* on conflict(id) do update set (%2$s)=(select %2$s from jsonb_populate_record(null::%1$I,$1)) where %1$I.owner_id=$2 returning to_jsonb(%1$I.*)',t,(select string_agg(quote_ident(attname),',') from pg_attribute where attrelid=t::regclass and attnum>0 and not attisdropped and attname not in ('id','owner_id','created_at'))) into result using rowdata,p_owner;
 if result is null then raise exception 'Not found'; end if;
 return result;
end $$;
revoke all on function finance_mutate(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function finance_mutate(text,text,text,jsonb) to service_role;
commit;
