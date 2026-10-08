-- Explicit opt-in only. Server action verifies FINANCE_INITIAL_OWNER_ID first.
begin;
create function finance_seed_initial(p_owner text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare a_ars uuid; g_egypt uuid; c_income uuid; c_housing uuid; c_sub uuid;
begin
 if p_owner is null or length(p_owner)=0 then raise exception 'Owner required'; end if;
 if p_owner<>'user_3Jhi2ofDzdnN0wrxodZ3KGFja8S' then raise exception 'Initial data belongs only to Laureano'; end if;
 perform pg_advisory_xact_lock(hashtextextended('finance:'||p_owner,0));
 insert into exchange_rates(owner_id) values(p_owner) on conflict do nothing;
 if (select seed_version from exchange_rates where owner_id=p_owner for update)>=1 then return false; end if;
 if exists(select 1 from finance_accounts where owner_id=p_owner) then raise exception 'Existing accounts: review opening balances before seed'; end if;
 insert into finance_accounts(owner_id,name,currency,opening_balance,description) values
 (p_owner,'Takenos','USD',372,'Saldo inicial aproximado; no es un ingreso.'),
 (p_owner,'AstroPay USD','USD',36,'Saldo inicial aproximado; no es un ingreso.'),
 (p_owner,'AstroPay ARS','ARS',55000,'Saldo inicial aproximado; no es un ingreso.'),
 (p_owner,'Mercado Pago','ARS',0,'Saldo inicial.');
 select id into a_ars from finance_accounts where owner_id=p_owner and name='AstroPay ARS';
 insert into finance_categories(owner_id,name,kind)
 select p_owner,n,'egreso' from unnest(array['Vivienda','Comida','Salud','Transporte','Ocio','Pareja','Suscripciones','Compras','Viajes','Educación','Otros']) n on conflict do nothing;
 insert into finance_categories(owner_id,name,kind) values(p_owner,'Seguro / Indemnización','ingreso'),(p_owner,'Retiro del negocio','ingreso'),(p_owner,'Personal','ingreso') on conflict do nothing;
 select id into c_income from finance_categories where owner_id=p_owner and name='Seguro / Indemnización';
 select id into c_housing from finance_categories where owner_id=p_owner and name='Vivienda';
 select id into c_sub from finance_categories where owner_id=p_owner and name='Suscripciones';
 insert into finance_schedules(owner_id,name,kind,amount,currency,account_id,category_id,frequency,origin,description)
 values(p_owner,'Seguro / Indemnización','income',366000,'ARS',a_ars,c_income,'monthly','Seguro','Ingreso esperado mensual. Completar próxima fecha; no implica un cobro registrado.');
 insert into finance_schedules(owner_id,name,kind,amount,currency,category_id,frequency,next_date,period_end,description)
 values(p_owner,'Airbnb Córdoba','expense',1500000,'ARS',c_housing,'once','2026-10-15','2026-11-15','Período temporal 15/10–15/11; pendiente, no recurrente.');
 insert into finance_schedules(owner_id,name,kind,amount,currency,category_id,status,description)
 select p_owner,n,'subscription',null,'ARS',c_sub,'incomplete','Monto y próxima fecha pendientes de completar.' from unnest(array['Netflix','YouTube Premium Familiar','Apple']) n;
 insert into finance_schedules(owner_id,name,kind,amount,currency,category_id,status,description)
 values(p_owner,'Instagram','subscription',25000,'ARS',c_sub,'incomplete','Monto aproximado; confirmar precio y próxima fecha.');
 insert into finance_obligations(owner_id,kind,counterparty,name,amount,currency,priority,target_month,status,allocation_known,monthly_payment,next_month,description) values
 (p_owner,'debt','Jeremías','Consciencia MCE / Santiago Gómez',1500,'USD','medium-high','2026-11','pending',true,null,null,'Pagar cuanto antes; objetivo antes o durante noviembre, sin día confirmado.'),
 (p_owner,'debt','Avalian','Avalian',700000,'ARS','medium',null,'review',false,null,null,'Monto aproximado conjunto Laureano + Cielo. Pendiente de discriminar. Excluido del patrimonio personal exacto.'),
 (p_owner,'debt','Tarjeta','Tarjeta refinanciada',null,'ARS','medium',null,'installments',true,131000,'2026-11','Saldo total y día de cuota pendientes. No es un gasto fijo; pagar mediante el plan.');
 insert into finance_goals(owner_id,name,kind,amount,currency,target_date,description) values
 (p_owner,'Egipto 2026','savings',15000,'USD','2026-11-25','Viaje, pasajes, compras y logística. MacBook aprox. USD 1.000–1.500, iPhone Cielo aprox. USD 1.000, malijas y cuidado/comida de perros. Sin desglose inventado.'),
 (p_owner,'Fondo de emergencia','savings',1000,'USD',null,'Fase inicial; luego puede expresarse en meses de gastos personales.'),
 (p_owner,'USD 10k netos mensuales','income',10000,'USD',null,'Ingresos personales efectivamente recibidos, netos de costos/equipo/herramientas/reserva del negocio. No facturación empresarial.');
 select id into g_egypt from finance_goals where owner_id=p_owner and name='Egipto 2026';
 insert into finance_goal_milestones(owner_id,goal_id,name,amount,target_month,description) values
 (p_owner,g_egypt,'Octubre: inicial + pasajes',4000,'2026-10','Aproximadamente USD 2.000 iniciales y USD 2.000 para pasajes. Día pendiente.'),
 (p_owner,g_egypt,'Noviembre: otro hito',5000,'2026-11','Hacia fines de noviembre; revisar compatibilidad con salida 25/11. No es el total final ni una fecha exacta confirmada.');
 update exchange_rates set seed_version=1 where owner_id=p_owner;
 return true;
end $$;
revoke all on function finance_seed_initial(text) from public,anon,authenticated;
grant execute on function finance_seed_initial(text) to service_role;
commit;
