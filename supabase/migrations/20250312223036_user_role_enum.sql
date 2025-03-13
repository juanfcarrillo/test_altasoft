create type user_role as enum ('admin', 'user');

create type invitation_status as enum ('pending', 'active');

drop table if exists public.customers cascade;

-- Create customers table with default email
create table public.customers (
    id uuid references auth.users(id) primary key,
    email text not null,
    role user_role default 'user'::user_role,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.customers (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function auth.handle_user_deletion()
returns trigger 
language plpgsql
security definer set search_path = ''
as $$
begin
    delete from public.customers where id = old.id;

    if found then
        return old;
    else
        raise notice 'No customer record found for user ID %', old.id;
        return old;
    end if;

exception when others then
    raise exception 'Error deleting customer record: %', sqlerrm;
end;
$$;

-- Create the trigger in auth schema
create trigger before_delete_user
    before delete on auth.users
    for each row
    execute function auth.handle_user_deletion();
