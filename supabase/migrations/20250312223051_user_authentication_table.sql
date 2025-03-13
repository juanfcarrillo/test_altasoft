create table public.invitations (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  status invitation_status default 'pending',
  invited_by uuid references public.customers(id),
  created_at timestamp with time zone default now(),
  user_id uuid references public.customers(id),
  constraint unique_pending_email unique (email, status)
);
