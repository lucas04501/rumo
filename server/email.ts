import nodemailer from 'nodemailer'

// Gmail com senha de app: sem domínio próprio e sem custo fixo.
const user = process.env.GMAIL_USER
const pass = process.env.GMAIL_APP_PASSWORD
const transport = user && pass ? nodemailer.createTransport({ service: 'gmail', auth: { user, pass } }) : null

// shortcut: o Gmail limita os envios por dia, trocar de provedor quando o volume passar disso.
export async function sendEmail(to: string, subject: string, text: string) {
  if (!transport) {
    // Em produção o texto não vai para o log, porque o link dá acesso à conta.
    if (process.env.NODE_ENV === 'production') {
      console.error('E-mail não enviado: faltam GMAIL_USER e GMAIL_APP_PASSWORD.')
      return
    }
    console.info(`E-mail de desenvolvimento para ${to}\n${subject}\n${text}`)
    return
  }
  await transport.sendMail({ from: `Rumo <${user}>`, to, subject, text })
}
