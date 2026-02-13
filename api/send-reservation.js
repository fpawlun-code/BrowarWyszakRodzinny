export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = req.body;

  // Build email HTML
  const emailHTML = `
    <h2>Nowa rezerwacja firmowa - Browar Wyszak</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Firma/Organizacja</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Firma || 'Nie podano'}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Osoba kontaktowa</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Osoba_kontaktowa}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Email</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Email}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Telefon</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Telefon}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Rodzaj wydarzenia</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Rodzaj_wydarzenia || 'Nie wybrano'}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Liczba osób</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Liczba_osob || 'Nie podano'}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Data wydarzenia</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Data_wydarzenia || 'Nie podano'}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">Godzina</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Godzina || 'Nie podano'}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; vertical-align: top;">Dodatkowe informacje</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${data.Dodatkowe_informacje || 'Brak'}</td>
      </tr>
    </table>
  `;

  try {
    // Use Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Browar Wyszak <onboarding@resend.dev>',
        to: 'fpawlun@gmail.com',
        reply_to: data.Email,
        subject: `Rezerwacja - ${data.Osoba_kontaktowa || 'Zapytanie'}`,
        html: emailHTML
      })
    });

    if (!response.ok) {
      throw new Error('Resend API failed');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }
}
