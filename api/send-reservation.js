function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeString(value, maxLength = 800) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.slice(0, maxLength);
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function normalizeMainChoices(value) {
  if (!Array.isArray(value)) return [];
  const compact = value
    .map((entry) => normalizeString(entry, 100))
    .filter(Boolean);
  return compact.slice(0, 3);
}

function normalizeStringArray(value, maxItems = 20, maxLength = 100) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeString(entry, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function computeAutoWarnings(normalized) {
  const warnings = [];
  const guestCount = normalized.guest_count;
  const eventDate = normalized.event_date ? new Date(`${normalized.event_date}T00:00:00`) : null;

  if (Number.isFinite(guestCount) && guestCount > 14) {
    warnings.push("Dla grup >14 osob obowiazuje menu grupowe.");
  }
  if (Number.isFinite(guestCount) && guestCount <= 10) {
    warnings.push("Do 10 osob: kontakt tel. 91 488 34 81 lub 662 233 678.");
  }
  if (Number.isFinite(guestCount) && guestCount > 10) {
    warnings.push("Pow. 10 osob: kontakt dedykowany 532 503 503 (pon-pt 11:30-17:00).");
  }
  if (Number.isFinite(guestCount) && guestCount > 35 && eventDate) {
    const day = eventDate.getDay();
    if (day === 5 || day === 6 || day === 0) {
      warnings.push("Grupy >35 w pt-sob-nd wymagaja potwierdzenia dostepnosci.");
    }
  }
  if (normalized.menu_mode === "undecided") {
    warnings.push("Klient nie wybral jeszcze wariantu menu.");
  }

  return warnings;
}

function computeLeadPriority(normalized) {
  const guestCount = normalized.guest_count;
  const eventDate = normalized.event_date ? new Date(`${normalized.event_date}T00:00:00`) : null;
  const now = new Date();
  const millisInDay = 24 * 60 * 60 * 1000;
  const daysToEvent = eventDate ? Math.floor((eventDate.getTime() - now.getTime()) / millisInDay) : null;

  if ((Number.isFinite(guestCount) && guestCount > 35) || (daysToEvent !== null && daysToEvent < 7)) {
    return "HIGH";
  }
  if (Number.isFinite(guestCount) && guestCount >= 15 && guestCount <= 35) {
    return "MEDIUM";
  }
  return "LOW";
}

function buildHtmlSection(title, rows, striped = true) {
  const body = rows
    .map((row, index) => {
      const rowBg = striped && index % 2 === 0 ? ' style="background:#f8f8f8;"' : "";
      return `
      <tr${rowBg}>
        <td style="padding:10px;border:1px solid #ddd;font-weight:600;width:38%;">${escapeHtml(row.label)}</td>
        <td style="padding:10px;border:1px solid #ddd;">${escapeHtml(row.value)}</td>
      </tr>`;
    })
    .join("");

  return `
    <h3 style="margin:24px 0 10px;font-size:16px;color:#8b1a0a;">${escapeHtml(title)}</h3>
    <table style="border-collapse:collapse;width:100%;max-width:720px;">${body}
    </table>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const body = req.body || {};
  const normalized = {
    Firma: normalizeString(body.Firma, 180),
    Osoba_kontaktowa: normalizeString(body.Osoba_kontaktowa, 180),
    Email: normalizeString(body.Email, 200),
    Telefon: normalizeString(body.Telefon, 80),
    Rodzaj_wydarzenia: normalizeString(body.Rodzaj_wydarzenia, 200),
    Liczba_osob: normalizeString(body.Liczba_osob, 20),
    Data_wydarzenia: normalizeString(body.Data_wydarzenia, 20),
    Godzina: normalizeString(body.Godzina, 20),
    Dodatkowe_informacje: normalizeString(body.Dodatkowe_informacje, 3000),
    client_type: normalizeString(body.client_type, 40) || "company",
    guest_count: normalizeNumber(body.guest_count ?? body.Liczba_osob),
    event_date: normalizeString(body.event_date ?? body.Data_wydarzenia, 20),
    event_time: normalizeString(body.event_time ?? body.Godzina, 20),
    menu_mode: normalizeString(body.menu_mode, 80) || "undecided",
    menu_main_choices: normalizeMainChoices(body.menu_main_choices),
    menu_soup_choices: normalizeStringArray(body.menu_soup_choices),
    menu_appetizer_choices: normalizeStringArray(body.menu_appetizer_choices),
    menu_soup_choice: normalizeString(body.menu_soup_choice, 80) || "undecided",
    menu_appetizer_choice: normalizeString(body.menu_appetizer_choice, 80) || "undecided",
    dietary_notes: normalizeString(body.dietary_notes, 1200),
    budget_per_person: normalizeString(body.budget_per_person, 40),
    needs_invoice: normalizeBoolean(body.needs_invoice, false),
    company_nip: normalizeString(body.company_nip, 64),
    preferred_contact_channel: normalizeString(body.preferred_contact_channel, 20) || "email",
    availability_question: normalizeBoolean(body.availability_question, true),
    additional_info: normalizeString(body.additional_info ?? body.Dodatkowe_informacje, 3000),
    locale: normalizeString(body.locale, 8) || "pl",
    warnings_generated: Array.isArray(body.warnings_generated)
      ? body.warnings_generated.map((x) => normalizeString(x, 260)).filter(Boolean)
      : [],
  };

  if (!normalized.Osoba_kontaktowa || !normalized.Email || !normalized.Telefon) {
    return res.status(400).json({ success: false, message: "Missing required contact fields" });
  }

  if (normalized.needs_invoice && !normalized.company_nip) {
    return res.status(400).json({ success: false, message: "NIP is required when invoice is requested" });
  }

  if (!normalized.event_date || !normalized.event_time) {
    return res.status(400).json({ success: false, message: "Event date and time are required" });
  }

  if (Number.isFinite(normalized.guest_count) && normalized.guest_count < 14) {
    return res.status(400).json({ success: false, message: "Corporate reservations require minimum 14 guests" });
  }

  const autoWarnings = computeAutoWarnings(normalized);
  const combinedWarnings = [...normalized.warnings_generated, ...autoWarnings].filter(Boolean);
  const leadPriority = computeLeadPriority(normalized);
  const soupsForEmail = normalized.menu_soup_choices.length
    ? normalized.menu_soup_choices
    : (normalized.menu_soup_choice ? [normalized.menu_soup_choice] : []);
  const appetizersForEmail = normalized.menu_appetizer_choices.length
    ? normalized.menu_appetizer_choices
    : (normalized.menu_appetizer_choice ? [normalized.menu_appetizer_choice] : []);

  const contactSection = buildHtmlSection("Dane kontaktowe", [
    { label: "Klient", value: normalized.client_type },
    { label: "Firma/Organizacja", value: normalized.Firma || "Nie podano" },
    { label: "Osoba kontaktowa", value: normalized.Osoba_kontaktowa },
    { label: "Email", value: normalized.Email },
    { label: "Telefon", value: normalized.Telefon },
  ]);

  const eventSection = buildHtmlSection("Parametry wydarzenia", [
    { label: "Rodzaj wydarzenia", value: normalized.Rodzaj_wydarzenia || "Nie podano" },
    { label: "Liczba osob", value: normalized.guest_count ?? normalized.Liczba_osob || "Nie podano" },
    { label: "Data", value: normalized.event_date || "Nie podano" },
    { label: "Godzina", value: normalized.event_time || "Nie podano" },
    { label: "Pytanie o dostepnosc", value: normalized.availability_question ? "Tak" : "Nie" },
  ]);

  const menuSection = buildHtmlSection("Konfiguracja menu", [
    { label: "Tryb menu", value: normalized.menu_mode },
    {
      label: "Dania glowne",
      value: normalized.menu_main_choices.length ? normalized.menu_main_choices.join(", ") : "Nie wybrano",
    },
    {
      label: "Zupy",
      value: soupsForEmail.length ? soupsForEmail.join(", ") : "Nie wybrano",
    },
    {
      label: "Przystawki",
      value: appetizersForEmail.length ? appetizersForEmail.join(", ") : "Nie wybrano",
    },
    { label: "Uwagi dietetyczne", value: normalized.dietary_notes || "Brak" },
  ]);

  const billingSection = buildHtmlSection("Rozliczenie i notatki", [
    { label: "Faktura", value: normalized.needs_invoice ? "Tak" : "Nie" },
    { label: "NIP", value: normalized.company_nip || "Nie podano" },
    { label: "Dodatkowe informacje", value: normalized.additional_info || "Brak" },
  ]);

  const warningSection = buildHtmlSection(
    "Ograniczenia i ostrzezenia",
    combinedWarnings.length
      ? combinedWarnings.map((entry, index) => ({ label: `Ostrzezenie ${index + 1}`, value: entry }))
      : [{ label: "Status", value: "Brak ostrzezen automatycznych" }]
  );

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;color:#222;line-height:1.45;">
      <h2 style="margin:0 0 8px;">Nowa rezerwacja firmowa - Browar Wyszak</h2>
      <p style="margin:0 0 18px;"><strong>Priorytet leada:</strong> ${escapeHtml(leadPriority)} | <strong>Locale:</strong> ${escapeHtml(normalized.locale)}</p>
      ${contactSection}
      ${eventSection}
      ${menuSection}
      ${warningSection}
      ${billingSection}
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Browar Wyszak <onboarding@resend.dev>",
        to: "fpawlun@gmail.com",
        reply_to: normalized.Email,
        subject: `[${leadPriority}] Rezerwacja - ${normalized.Osoba_kontaktowa || "Zapytanie"}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Resend API failed: ${errText}`);
    }

    return res.status(200).json({ success: true, leadPriority, warnings: combinedWarnings });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
}
