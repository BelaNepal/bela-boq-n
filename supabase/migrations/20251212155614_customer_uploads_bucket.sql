-- Create the customer_info bucket
insert into storage.buckets (id, name, public)
values ('customer_info', 'customer_info', true)
on conflict (id) do nothing;

-- Set up security policy for public upload access
-- Note: In production, you might want to restrict this to authenticated users or specific criteria.
-- For now, we allow public uploads for the form.

create policy "Public Access"
  on storage.objects for all
  using ( bucket_id = 'customer_info' )
  with check ( bucket_id = 'customer_info' );
