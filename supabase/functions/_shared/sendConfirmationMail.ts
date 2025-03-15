import * as nodemailer from 'npm:nodemailer';

const gmailSmptPassword = Deno.env.get('GMAIL_APP_PASSWORD')!;
const gmailRecipeEmail = Deno.env.get('GMAIL_RECIPE_EMAIL')!;

const gmailSmpt = {
  hostname: 'smtp.gmail.com',
  port: 465,
  username: gmailRecipeEmail,
  password: gmailSmptPassword,
  tls: true,
};

const client = nodemailer.createTransport({
  host: gmailSmpt.hostname,
  port: gmailSmpt.port,
  secure: gmailSmpt.tls,
  auth: {
    user: gmailSmpt.username,
    pass: gmailSmpt.password,
  },
});

async function sendEmail(options: {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  smtp: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    tls?: boolean;
  };
}) {
  try {
    await client.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || '',
    });

    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
export async function sendGmailConfirmationMail(options: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  await sendEmail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    smtp: gmailSmpt,
    html: options.html,
  });
}
