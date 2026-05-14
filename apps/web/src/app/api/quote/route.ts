import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log to console (wire up to Resend / Supabase in production)
    console.log('[Quote Request]', JSON.stringify(body, null, 2));

    // TODO: Send email via Resend
    // await resend.emails.send({ from: 'quotes@nazrahalalam.com', to: 'Nazaralalam@gmail.com', subject: `New Quote: ${body.projectType}`, text: JSON.stringify(body) });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Quote API Error]', error);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
