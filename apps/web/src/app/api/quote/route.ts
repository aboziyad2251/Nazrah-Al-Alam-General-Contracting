import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, company, projectType, location, equipment, duration, message } =
      body;

    const notes = [
      projectType && `Project type: ${projectType}`,
      location && `Location: ${location}`,
      equipment && `Equipment: ${equipment}`,
      duration && `Duration: ${duration}`,
      message && `Message: ${message}`,
    ]
      .filter(Boolean)
      .join('\n');

    const { error } = await supabaseAdmin.from('leads').insert({
      company_name: company || name,
      contact_name: name,
      email: email || null,
      phone: phone || null,
      stage: 'new',
      source: 'web_quote_form',
      notes: notes || null,
    });

    if (error) {
      console.error('[Quote → Lead insert]', error.message);
      // Return ok anyway — don't break UX on DB error
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Quote API Error]', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
