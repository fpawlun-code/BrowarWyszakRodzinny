export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const formData = req.body;

  // Format email body
  const emailBody = `
Nowa rezerwacja firmowa - Browar Wyszak

Firma/Organizacja: ${formData.Firma || 'Nie podano'}
Osoba kontaktowa: ${formData.Osoba_kontaktowa}
Email: ${formData.Email}
Telefon: ${formData.Telefon}
Rodzaj wydarzenia: ${formData.Rodzaj_wydarzenia || 'Nie wybrano'}
Liczba osób: ${formData.Liczba_osob || 'Nie podano'}
Data wydarzenia: ${formData.Data_wydarzenia || 'Nie podano'}
Godzina: ${formData.Godzina || 'Nie podano'}

Dodatkowe informacje:
${formData.Dodatkowe_informacje || 'Brak'}
  `.trim();

  try {
    // Import nodemailer dynamically
    const nodemailer = await import('nodemailer');

    // Create transporter (using Gmail)
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Send email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'fpawlun@gmail.com',
      replyTo: formData.Email,
      subject: 'Rezerwacja firmowa - Browar Wyszak',
      text: emailBody
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }
}
