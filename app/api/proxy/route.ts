import { NextResponse } from 'next/server';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqNrl1b6qfVNPcUH75FPdZTQax6pjKZT9lDo8jADHBgtx_9dFmO3WuHZ8E1gGp7MM44w/exec";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('--- PROXY REQUEST ---');
    console.log('Action:', body.action);
    
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'follow',
    });

    const responseText = await response.text();
    console.log('--- GOOGLE RESPONSE ---');

    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (e) {
      console.error('JSON Parse Error:', responseText);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'El servidor de Google devolvió una respuesta no válida. Revisa los logs de Apps Script.' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Error interno en el Proxy: ' + error.message },
      { status: 500 }
    );
  }
}
