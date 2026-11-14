-- ========================================================
-- CATURRA COFFEE ROASTER - SUPABASE INITIALIZATION SCRIPT
-- انسخ هذا الكود بالكامل وضعه في SQL Editor داخل Supabase ثم اضغط Run
-- ========================================================

-- 1. جدول حفظ حالة وبيانات النظام الكاملة (المنتجات، تصاميم الأكياس، العملاء، الطلبات، الفواتير)
create table if not exists caturra_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- تفعيل سياسة الأمان RLS والسماح بالقراءة والكتابة للـ API
alter table caturra_state enable row level security;

drop policy if exists "Allow all access to caturra_state" on caturra_state;
create policy "Allow all access to caturra_state" 
  on caturra_state 
  for all 
  using (true) 
  with check (true);

-- 2. إنشاء مستودع التخزين السحابي (Storage Bucket) لحفظ صور وإيصالات الفواتير
insert into storage.buckets (id, name, public) 
values ('invoices', 'invoices', true)
on conflict (id) do update set public = true;

-- سياسات قراءة ورفع الصور في الـ Bucket
drop policy if exists "Public Access to Invoices" on storage.objects;
create policy "Public Access to Invoices" 
  on storage.objects for select 
  using ( bucket_id = 'invoices' );

drop policy if exists "Public Upload to Invoices" on storage.objects;
create policy "Public Upload to Invoices" 
  on storage.objects for insert 
  with check ( bucket_id = 'invoices' );

drop policy if exists "Public Update to Invoices" on storage.objects;
create policy "Public Update to Invoices" 
  on storage.objects for update 
  using ( bucket_id = 'invoices' );
