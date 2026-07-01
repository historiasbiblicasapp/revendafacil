import { NextResponse } from 'next/server'

const WHATSAPP_PHONE = '5524988112657'

async function sendWhatsApp(text: string) {
  const apiKey = process.env.CALLMEBOT_API_KEY
  if (!apiKey) return
  const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(text)}&apikey=${apiKey}`
  await fetch(url, { method: 'GET' }).catch(() => {})
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-webhook-secret')
    if (secret && secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const record = body.record

    const nome = record?.nome || '—'
    const email = record?.email || '—'
    const data = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const msg = [
      '🆕 Novo cliente cadastrado!',
      `👤 Nome: ${nome}`,
      `📧 Email: ${email}`,
      `📅 ${data}`,
      '🔗 https://revendafacil-liard.vercel.app/admin/assinaturas',
    ].join('\n')

    await sendWhatsApp(msg)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
