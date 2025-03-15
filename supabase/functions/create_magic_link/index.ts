// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { sendGmailConfirmationMail } from '../_shared/sendConfirmationMail.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { supabaseClient } from '../_shared/supabaseClient.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  const authHeader = req.headers.get('Authorization')!;
  const body = await req.json();

  const { email, redirectTo } = body;

  if (!authHeader || authHeader.trim() === '') {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { error: otpError, data: otpData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo,
      },
    });

    if (otpError) {
      return new Response(JSON.stringify({ error: otpError }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const queryParams = new URLSearchParams({
      token_hash: otpData.properties.hashed_token,
      email,
    });

    const magiclink = `${redirectTo}?${queryParams.toString()}`;

    await sendGmailConfirmationMail({
      from: 'PingAI <noreply@pingai.com>',
      to: email,
      subject: 'Confirm your email address',
      text: `Please click the link below to confirm your email address:
        ${magiclink}
      `,
      html: `Please click the link below to confirm your email address:
        <a href="${magiclink}">${magiclink}</a>
      `,
    });

    return new Response(JSON.stringify({ status: 'created email' }), {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('email', user?.email!)
    .eq('id', user?.id!)
    .single();

  if (error || customerError) {
    return new Response(JSON.stringify({ error }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (!user || customer?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { data: otpData, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo,
    },
  });

  if (otpError) {
    return new Response(JSON.stringify({ error: otpError }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const queryParams = new URLSearchParams({
    token_hash: otpData.properties.hashed_token,
    email,
  });

  const token_hash = otpData.properties.hashed_token;
  const magiclink = `${redirectTo}?${queryParams.toString()}`;
  const redirectRoute = `?${queryParams.toString()}`;

  await sendGmailConfirmationMail({
    from: 'PingAI <noreply@pingai.com>',
    to: email,
    subject: 'Confirm your email address',
    text: `Please click the link below to confirm your email address:
      ${magiclink}
    `,
    html: `Please click the link below to confirm your email address:
      <a href="${magiclink}">${magiclink}</a>
    `,
  });

  return new Response(
    JSON.stringify({
      token_hash,
      email,
      magiclink,
      redirectRoute,
    }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create_magic_link' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
