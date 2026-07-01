import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) throw error
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ status: 'error', message: String(err) }, { status: 500 })
  }
}
