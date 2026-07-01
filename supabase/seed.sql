-- =============================================================================
-- BullSales Suite — seed data
-- Runs on `supabase db reset`. Creates demo auth users + sample CRM data.
-- All demo users password: password123
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Auth users (profiles are auto-created by the on_auth_user_created trigger)
-- ---------------------------------------------------------------------------
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000','11111111-1111-1111-1111-111111111111','authenticated','authenticated','admin@bullrealty.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aarav Mehta","role":"super_admin"}',     now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','22222222-2222-2222-2222-222222222222','authenticated','authenticated','manager@bullrealty.com',  crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma","role":"sales_manager"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','33333333-3333-3333-3333-333333333333','authenticated','authenticated','rahul@bullrealty.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rahul Verma","role":"sales_executive"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','44444444-4444-4444-4444-444444444444','authenticated','authenticated','sneha@bullrealty.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sneha Patil","role":"sales_executive"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','55555555-5555-5555-5555-555555555555','authenticated','authenticated','kavya@bullrealty.com',    crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kavya Reddy","role":"telecaller"}',      now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','66666666-6666-6666-6666-666666666666','authenticated','authenticated','marketing@bullrealty.com',crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arjun Nair","role":"marketing"}',        now(), now(), '', '', '', '');

insert into auth.identities
  (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email),
       'email', now(), now(), now()
from auth.users u
where u.email like '%@bullrealty.com';

-- ---------------------------------------------------------------------------
-- Teams + profile enrichment
-- ---------------------------------------------------------------------------
insert into public.teams (id, name, manager_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001','Mumbai Sales','22222222-2222-2222-2222-222222222222');

update public.profiles set phone='+91 98200 11111', team_id='aaaaaaaa-0000-0000-0000-000000000001', did_number='+91 22 4000 1001' where id='11111111-1111-1111-1111-111111111111';
update public.profiles set phone='+91 98200 22222', team_id='aaaaaaaa-0000-0000-0000-000000000001', did_number='+91 22 4000 1002' where id='22222222-2222-2222-2222-222222222222';
update public.profiles set phone='+91 98200 33333', team_id='aaaaaaaa-0000-0000-0000-000000000001', reporting_manager_id='22222222-2222-2222-2222-222222222222', did_number='+91 22 4000 1003' where id='33333333-3333-3333-3333-333333333333';
update public.profiles set phone='+91 98200 44444', team_id='aaaaaaaa-0000-0000-0000-000000000001', reporting_manager_id='22222222-2222-2222-2222-222222222222', did_number='+91 22 4000 1004' where id='44444444-4444-4444-4444-444444444444';
update public.profiles set phone='+91 98200 55555', team_id='aaaaaaaa-0000-0000-0000-000000000001', reporting_manager_id='22222222-2222-2222-2222-222222222222', did_number='+91 22 4000 1005' where id='55555555-5555-5555-5555-555555555555';

-- ---------------------------------------------------------------------------
-- Configuration: sources, statuses, stages, dispositions
-- ---------------------------------------------------------------------------
insert into public.lead_sources (name) values
  ('Meta Ads'),('Google Ads'),('99acres'),('MagicBricks'),('Housing'),('Website'),('Referral'),('Walk-in'),('WhatsApp');

insert into public.lead_statuses (name, sort_order, color, is_won, is_lost) values
  ('new',0,'#3463ff',false,false),('assigned',1,'#6366f1',false,false),('contacted',2,'#0ea5e9',false,false),
  ('interested',3,'#10b981',false,false),('follow_up',4,'#f59e0b',false,false),('site_visit_planned',5,'#8b5cf6',false,false),
  ('site_visit_done',6,'#14b8a6',false,false),('negotiation',7,'#f97316',false,false),('booking_expected',8,'#22c55e',false,false),
  ('converted',9,'#16a34a',true,false),('not_interested',10,'#64748b',false,false),('lost',11,'#ef4444',false,true),('duplicate',12,'#94a3b8',false,false);

insert into public.deal_stages (name, sort_order, probability, color, is_won, is_lost) values
  ('new_opportunity',0,10,'#3463ff',false,false),('requirement_discussion',1,20,'#6366f1',false,false),
  ('site_visit_planned',2,35,'#8b5cf6',false,false),('site_visit_completed',3,50,'#14b8a6',false,false),
  ('negotiation',4,65,'#f97316',false,false),('token_discussion',5,80,'#f59e0b',false,false),
  ('booking_confirmed',6,90,'#22c55e',false,false),('agreement_pending',7,95,'#0ea5e9',false,false),
  ('closed_won',8,100,'#16a34a',true,false),('closed_lost',9,0,'#ef4444',false,true);

insert into public.call_dispositions (name, sort_order) values
  ('Connected',0),('Not connected',1),('Busy',2),('Switched off',3),('Not reachable',4),
  ('Wrong number',5),('Call back later',6),('Interested',7),('Not interested',8);

-- ---------------------------------------------------------------------------
-- WhatsApp + Email templates
-- ---------------------------------------------------------------------------
insert into public.whatsapp_templates (name, category, body) values
  ('Welcome Message','welcome','Thank you for contacting Bull Realty Global. Our sales team will connect with you shortly. View our projects: {{link}}'),
  ('Site Visit Confirmation','site_visit','Your site visit for {{project}} is confirmed on {{date}} at {{time}}. Our executive {{owner}} will meet you there.'),
  ('Follow-up Reminder','follow_up','Hi {{name}}, just following up on your interest in {{project}}. Shall we schedule a site visit this week?'),
  ('Missed Call Auto-reply','missed_call','Hi {{name}}, sorry we missed your call. Our team will call you back shortly. - Bull Realty Global'),
  ('Booking Confirmation','booking','Congratulations {{name}}! Your booking for {{project}} is confirmed. Welcome to the Bull Realty Global family.');

insert into public.email_templates (name, subject, body) values
  ('Welcome Email','Welcome to Bull Realty Global','Dear {{name}},\n\nThank you for your interest. Please find our project details attached.\n\nRegards,\nBull Realty Global'),
  ('Price Quote','Price details for {{project}}','Dear {{name}},\n\nPlease find the latest price details for {{project}}.\n\nRegards,\nBull Realty Global'),
  ('Site Visit Confirmation','Your site visit is confirmed','Dear {{name}},\n\nYour site visit is confirmed for {{date}}.\n\nRegards,\nBull Realty Global');

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
insert into public.projects (id, name, developer, location, city, property_type, price_min, price_max, unit_types, possession_date, rera_number, status, description) values
  ('cccccccc-0000-0000-0000-000000000001','Skyline Heights','Bull Developers','Andheri West','Mumbai','residential',12500000,32000000,'{2BHK,3BHK,4BHK}','2027-06-30','P51800001234','active','Premium high-rise apartments with sea view in Andheri West.'),
  ('cccccccc-0000-0000-0000-000000000002','Green Valley Villas','Evergreen Group','Lonavala','Pune','villa',25000000,65000000,'{"3BHK Villa","4BHK Villa"}','2026-12-31','P52100005678','active','Gated villa community amidst the hills of Lonavala.'),
  ('cccccccc-0000-0000-0000-000000000003','Metro Business Park','Bull Commercial','BKC','Mumbai','commercial',9000000,45000000,'{Office,Retail}','2026-03-31','P51800009012','active','Grade-A commercial office and retail spaces in BKC.'),
  ('cccccccc-0000-0000-0000-000000000004','Riverside Residency','Bull Developers','Kharadi','Pune','apartment',6500000,14000000,'{1BHK,2BHK,3BHK}','2027-09-30','P52100003456','upcoming','Affordable riverside apartments in Kharadi.');

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------
insert into public.campaigns (name, platform, start_date, end_date, budget, spend, leads_generated, project_id, status) values
  ('Skyline Launch - Meta','meta','2026-05-01','2026-06-30',500000,420000,180,'cccccccc-0000-0000-0000-000000000001','active'),
  ('Green Valley - Google','google','2026-05-15','2026-07-15',350000,210000,95,'cccccccc-0000-0000-0000-000000000002','active'),
  ('BKC Offices - 99acres','99acres','2026-04-01','2026-06-30',250000,250000,60,'cccccccc-0000-0000-0000-000000000003','completed');

-- ---------------------------------------------------------------------------
-- Accounts + contacts
-- ---------------------------------------------------------------------------
insert into public.accounts (id, name, company_name, contact_person, phone, email, city, industry, owner_id) values
  ('dddddddd-0000-0000-0000-000000000001','Infosys Relocation','Infosys Ltd','HR Mobility','+91 80 4000 0000','mobility@infosys.com','Pune','IT Services','22222222-2222-2222-2222-222222222222'),
  ('dddddddd-0000-0000-0000-000000000002','Sharma Family Office','Sharma Investments','Vikram Sharma','+91 98765 00000','vikram@sharmainv.com','Mumbai','Investments','33333333-3333-3333-3333-333333333333');

insert into public.contacts (id, full_name, phone, email, account_id, city, contact_type, owner_id, tags) values
  ('eeeeeeee-0000-0000-0000-000000000001','Vikram Sharma','+91 98765 00000','vikram@sharmainv.com','dddddddd-0000-0000-0000-000000000002','Mumbai','investor','33333333-3333-3333-3333-333333333333','{vip,investor}'),
  ('eeeeeeee-0000-0000-0000-000000000002','Anita Desai','+91 99887 12345','anita.desai@gmail.com',null,'Pune','buyer','44444444-4444-4444-4444-444444444444','{end-user}'),
  ('eeeeeeee-0000-0000-0000-000000000003','Rohan Kapoor','+91 91234 56789','rohan.k@outlook.com',null,'Mumbai','channel_partner','33333333-3333-3333-3333-333333333333','{broker}');

-- ---------------------------------------------------------------------------
-- Leads (varied statuses, owners, priorities)
-- ---------------------------------------------------------------------------
insert into public.leads (full_name, phone, email, project_id, budget, city, source_id, campaign_id, status, priority, score, owner_id, manager_id, follow_up_at, last_activity_at, created_by, created_at) values
  ('Sanjay Gupta','+91 90000 10001','sanjay.g@gmail.com','cccccccc-0000-0000-0000-000000000001',18000000,'Mumbai',(select id from lead_sources where name='Meta Ads'),(select id from campaigns where name='Skyline Launch - Meta'),'new','hot',82,'33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222', now() + interval '2 hours', now(), '66666666-6666-6666-6666-666666666666', now() - interval '1 day'),
  ('Meera Iyer','+91 90000 10002','meera.iyer@gmail.com','cccccccc-0000-0000-0000-000000000002',32000000,'Pune',(select id from lead_sources where name='Google Ads'),(select id from campaigns where name='Green Valley - Google'),'contacted','hot',76,'44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222', now() + interval '1 day', now() - interval '3 hours', '66666666-6666-6666-6666-666666666666', now() - interval '2 days'),
  ('Imran Shaikh','+91 90000 10003','imran.shaikh@gmail.com','cccccccc-0000-0000-0000-000000000003',22000000,'Mumbai',(select id from lead_sources where name='99acres'),null,'interested','warm',68,'33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222', now() + interval '3 days', now() - interval '5 hours', '11111111-1111-1111-1111-111111111111', now() - interval '3 days'),
  ('Pooja Nair','+91 90000 10004','pooja.nair@gmail.com','cccccccc-0000-0000-0000-000000000001',15000000,'Mumbai',(select id from lead_sources where name='Website'),null,'site_visit_planned','hot',88,'44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222', now() + interval '1 day', now() - interval '1 day', '11111111-1111-1111-1111-111111111111', now() - interval '4 days'),
  ('Deepak Joshi','+91 90000 10005','deepak.joshi@gmail.com','cccccccc-0000-0000-0000-000000000004',9000000,'Pune',(select id from lead_sources where name='MagicBricks'),null,'follow_up','warm',55,'33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222', now() - interval '1 day', now() - interval '2 days', '11111111-1111-1111-1111-111111111111', now() - interval '5 days'),
  ('Lakshmi Menon','+91 90000 10006','lakshmi.menon@gmail.com','cccccccc-0000-0000-0000-000000000002',45000000,'Pune',(select id from lead_sources where name='Referral'),null,'negotiation','hot',91,'44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222', now() + interval '12 hours', now() - interval '6 hours', '11111111-1111-1111-1111-111111111111', now() - interval '8 days'),
  ('Farhan Khan','+91 90000 10007','farhan.khan@gmail.com','cccccccc-0000-0000-0000-000000000003',12000000,'Mumbai',(select id from lead_sources where name='Walk-in'),null,'site_visit_done','warm',72,'33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222', now() + interval '2 days', now() - interval '1 day', '11111111-1111-1111-1111-111111111111', now() - interval '10 days'),
  ('Nisha Agarwal','+91 90000 10008','nisha.a@gmail.com','cccccccc-0000-0000-0000-000000000001',28000000,'Mumbai',(select id from lead_sources where name='Meta Ads'),(select id from campaigns where name='Skyline Launch - Meta'),'converted','hot',95,'44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222', null, now() - interval '2 days', '66666666-6666-6666-6666-666666666666', now() - interval '20 days'),
  ('Vivek Rao','+91 90000 10009','vivek.rao@gmail.com','cccccccc-0000-0000-0000-000000000004',7500000,'Pune',(select id from lead_sources where name='Housing'),null,'not_interested','cold',28,'33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222', null, now() - interval '7 days', '11111111-1111-1111-1111-111111111111', now() - interval '15 days'),
  ('Ananya Bose','+91 90000 10010','ananya.bose@gmail.com','cccccccc-0000-0000-0000-000000000002',38000000,'Pune',(select id from lead_sources where name='Google Ads'),(select id from campaigns where name='Green Valley - Google'),'new','warm',60,'44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222', now() + interval '4 hours', now(), '66666666-6666-6666-6666-666666666666', now() - interval '6 hours'),
  ('Karan Malhotra','+91 90000 10011','karan.m@gmail.com','cccccccc-0000-0000-0000-000000000003',16000000,'Mumbai',(select id from lead_sources where name='99acres'),null,'lost','cold',20,'33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222', null, now() - interval '12 days', '11111111-1111-1111-1111-111111111111', now() - interval '25 days'),
  ('Shreya Pillai','+91 90000 10012','shreya.pillai@gmail.com','cccccccc-0000-0000-0000-000000000001',21000000,'Mumbai',(select id from lead_sources where name='Website'),null,'booking_expected','hot',89,'44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222', now() + interval '1 day', now() - interval '4 hours', '11111111-1111-1111-1111-111111111111', now() - interval '9 days');

-- mark a duplicate
update public.leads set is_duplicate = true, status='duplicate' where full_name='Vivek Rao';

-- ---------------------------------------------------------------------------
-- Deals across pipeline stages
-- ---------------------------------------------------------------------------
insert into public.deals (name, lead_id, project_id, value, expected_close_date, probability, stage_id, owner_id, source_id) values
  ('Skyline 3BHK - Sanjay Gupta',(select id from leads where full_name='Sanjay Gupta'),'cccccccc-0000-0000-0000-000000000001',18000000,current_date + 30,20,(select id from deal_stages where name='requirement_discussion'),'33333333-3333-3333-3333-333333333333',(select id from lead_sources where name='Meta Ads')),
  ('Green Valley Villa - Lakshmi',(select id from leads where full_name='Lakshmi Menon'),'cccccccc-0000-0000-0000-000000000002',45000000,current_date + 15,65,(select id from deal_stages where name='negotiation'),'44444444-4444-4444-4444-444444444444',(select id from lead_sources where name='Referral')),
  ('BKC Office - Imran',(select id from leads where full_name='Imran Shaikh'),'cccccccc-0000-0000-0000-000000000003',22000000,current_date + 45,50,(select id from deal_stages where name='site_visit_completed'),'33333333-3333-3333-3333-333333333333',(select id from lead_sources where name='99acres')),
  ('Skyline 2BHK - Pooja',(select id from leads where full_name='Pooja Nair'),'cccccccc-0000-0000-0000-000000000001',15000000,current_date + 20,35,(select id from deal_stages where name='site_visit_planned'),'44444444-4444-4444-4444-444444444444',(select id from lead_sources where name='Website')),
  ('Skyline 4BHK - Nisha (Won)',(select id from leads where full_name='Nisha Agarwal'),'cccccccc-0000-0000-0000-000000000001',28000000,current_date - 2,100,(select id from deal_stages where name='closed_won'),'44444444-4444-4444-4444-444444444444',(select id from lead_sources where name='Meta Ads')),
  ('Skyline - Shreya (Booking)',(select id from leads where full_name='Shreya Pillai'),'cccccccc-0000-0000-0000-000000000001',21000000,current_date + 7,90,(select id from deal_stages where name='booking_confirmed'),'44444444-4444-4444-4444-444444444444',(select id from lead_sources where name='Website')),
  ('BKC Retail - Karan (Lost)',(select id from leads where full_name='Karan Malhotra'),'cccccccc-0000-0000-0000-000000000003',16000000,current_date - 5,0,(select id from deal_stages where name='closed_lost'),'33333333-3333-3333-3333-333333333333',(select id from lead_sources where name='99acres'));

update public.deals set lost_reason='price_issue' where name like '%Lost%';

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
insert into public.tasks (title, type, lead_id, assignee_id, due_at, priority, status, created_by) values
  ('Call Sanjay Gupta - intro', 'call', (select id from leads where full_name='Sanjay Gupta'),'33333333-3333-3333-3333-333333333333', now() + interval '2 hours','high','pending','22222222-2222-2222-2222-222222222222'),
  ('WhatsApp brochure to Meera', 'whatsapp', (select id from leads where full_name='Meera Iyer'),'44444444-4444-4444-4444-444444444444', now() + interval '1 day','medium','pending','22222222-2222-2222-2222-222222222222'),
  ('Site visit follow-up - Pooja','site_visit',(select id from leads where full_name='Pooja Nair'),'44444444-4444-4444-4444-444444444444', now() - interval '3 hours','high','overdue','22222222-2222-2222-2222-222222222222'),
  ('Negotiation call - Lakshmi','call',(select id from leads where full_name='Lakshmi Menon'),'44444444-4444-4444-4444-444444444444', now() + interval '12 hours','high','pending','22222222-2222-2222-2222-222222222222'),
  ('Send price quote - Imran','email',(select id from leads where full_name='Imran Shaikh'),'33333333-3333-3333-3333-333333333333', now() - interval '1 day','medium','completed','22222222-2222-2222-2222-222222222222');

-- ---------------------------------------------------------------------------
-- Calls, WhatsApp, activities, notifications
-- ---------------------------------------------------------------------------
insert into public.calls (lead_id, phone, user_id, direction, status, disposition, duration_seconds, started_at) values
  ((select id from leads where full_name='Meera Iyer'),'+91 90000 10002','44444444-4444-4444-4444-444444444444','outgoing','connected','Interested',245, now() - interval '3 hours'),
  ((select id from leads where full_name='Imran Shaikh'),'+91 90000 10003','33333333-3333-3333-3333-333333333333','outgoing','connected','Call back later',132, now() - interval '5 hours'),
  ((select id from leads where full_name='Deepak Joshi'),'+91 90000 10005','33333333-3333-3333-3333-333333333333','outgoing','not_connected','Switched off',0, now() - interval '2 days');

insert into public.whatsapp_messages (lead_id, user_id, direction, body, status, sent_at) values
  ((select id from leads where full_name='Sanjay Gupta'),'33333333-3333-3333-3333-333333333333','outgoing','Thank you for contacting Bull Realty Global. View Skyline Heights details here.','read', now() - interval '20 hours'),
  ((select id from leads where full_name='Meera Iyer'),'44444444-4444-4444-4444-444444444444','outgoing','Hi Meera, sharing the Green Valley Villas brochure.','delivered', now() - interval '2 hours');

insert into public.activities (type, description, actor_id, lead_id) values
  ('lead_created','Lead created from Meta Ads','66666666-6666-6666-6666-666666666666',(select id from leads where full_name='Sanjay Gupta')),
  ('lead_assigned','Assigned to Rahul Verma','22222222-2222-2222-2222-222222222222',(select id from leads where full_name='Sanjay Gupta')),
  ('whatsapp_sent','Welcome WhatsApp message sent','33333333-3333-3333-3333-333333333333',(select id from leads where full_name='Sanjay Gupta')),
  ('call_made','Outgoing call - 4m 5s - Interested','44444444-4444-4444-4444-444444444444',(select id from leads where full_name='Meera Iyer')),
  ('status_changed','Status changed to Negotiation','44444444-4444-4444-4444-444444444444',(select id from leads where full_name='Lakshmi Menon'));

insert into public.notifications (user_id, type, title, body, link) values
  ('33333333-3333-3333-3333-333333333333','lead_assigned','New lead assigned','Sanjay Gupta (Hot) was assigned to you','/leads'),
  ('44444444-4444-4444-4444-444444444444','follow_up','Follow-up due','Negotiation call with Lakshmi in 12 hours','/tasks'),
  ('22222222-2222-2222-2222-222222222222','escalation','Overdue follow-up','Pooja Nair site-visit follow-up is overdue','/tasks');

-- ---------------------------------------------------------------------------
-- Automation rules (definitions; engine execution is app-side)
-- ---------------------------------------------------------------------------
insert into public.automation_rules (name, trigger, conditions, actions, active, created_by) values
  ('Auto-assign new leads (round robin)','lead.created','[]','[{"type":"assign_round_robin"},{"type":"send_whatsapp","template":"Welcome Message"}]', true,'11111111-1111-1111-1111-111111111111'),
  ('Escalate uncontacted leads','lead.uncontacted_30m','[{"field":"status","op":"eq","value":"new"}]','[{"type":"notify_manager"}]', true,'11111111-1111-1111-1111-111111111111'),
  ('Thank-you after site visit','site_visit.completed','[]','[{"type":"send_whatsapp","template":"Booking Confirmation"}]', true,'11111111-1111-1111-1111-111111111111');
