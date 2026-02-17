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

function buildReservationId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BW-${yyyy}${mm}${dd}-${hh}${min}${sec}-${rand}`;
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

function prettifyToken(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapValue(value, map) {
  const token = prettifyToken(value);
  if (!token) return "";
  return map[token] || token;
}

function getLocalePack(locale) {
  const lang = String(locale || "pl").toLowerCase();
  if (lang.startsWith("en")) {
    return {
      subjectPrefix: "Corporate booking",
      title: "New corporate reservation - Browar Wyszak",
      lead: "Lead priority",
      sections: {
        contact: "Contact details",
        event: "Event details",
        menu: "Menu selection",
        warnings: "Operational notes",
      },
      labels: {
        client: "Client type",
        contactPerson: "Contact person",
        email: "Email",
        phone: "Phone",
        guests: "Guest count",
        date: "Date",
        time: "Start time",
        mode: "Menu mode",
        mains: "Main courses",
        soups: "Soups",
        appetizers: "Appetizers",
        dietary: "Dietary notes",
        additional: "Additional info",
        warnings: "Warnings",
      },
      values: {
        notProvided: "Not provided",
        none: "None",
        undecided: "To be confirmed",
        buffetInfo: "Buffet/bemar mode selected (>40 guests) - classic dish list selection is not required.",
      },
    };
  }
  if (lang.startsWith("de")) {
    return {
      subjectPrefix: "Firmenreservierung",
      title: "Neue Firmenreservierung - Browar Wyszak",
      lead: "Lead-Prioritat",
      sections: {
        contact: "Kontaktdaten",
        event: "Veranstaltungsdaten",
        menu: "Menuauswahl",
        warnings: "Betriebshinweise",
      },
      labels: {
        client: "Kundentyp",
        contactPerson: "Ansprechpartner",
        email: "E-Mail",
        phone: "Telefon",
        guests: "Anzahl Gaste",
        date: "Datum",
        time: "Uhrzeit",
        mode: "Menu-Modus",
        mains: "Hauptgerichte",
        soups: "Suppen",
        appetizers: "Vorspeisen",
        dietary: "Ernahrungshinweise",
        additional: "Zusatzliche Informationen",
        warnings: "Warnungen",
      },
      values: {
        notProvided: "Nicht angegeben",
        none: "Keine",
        undecided: "Noch offen",
        buffetInfo: "Buffet-/Bemar-Modus gewahlt (>40 Personen) - Auswahl einzelner Gerichte aus der Karte ist nicht erforderlich.",
      },
    };
  }
  return {
    subjectPrefix: "Rezerwacja firmowa",
    title: "Nowa rezerwacja firmowa - Browar Wyszak",
    lead: "Priorytet leada",
    sections: {
      contact: "Dane kontaktowe",
      event: "Parametry wydarzenia",
      menu: "Konfiguracja menu",
      warnings: "Ostrzezenia operacyjne",
    },
    labels: {
      client: "Typ klienta",
      contactPerson: "Osoba kontaktowa",
      email: "Email",
      phone: "Telefon",
      guests: "Liczba gosci",
      date: "Data",
      time: "Godzina",
      mode: "Wariant menu",
      mains: "Dania glowne",
      soups: "Zupy",
      appetizers: "Przystawki",
      dietary: "Uwagi dietetyczne",
      additional: "Dodatkowe informacje",
      warnings: "Ostrzezenia",
    },
    values: {
      notProvided: "Nie podano",
      none: "Brak",
      undecided: "Do ustalenia",
      buffetInfo: "Wybrano wariant bufet/bemary (>40 osob) - wybor dań z karty nie jest wymagany.",
    },
  };
}

function renderList(items, emptyText) {
  if (!items.length) {
    return `<span style="color:#8a8a8a;">${escapeHtml(emptyText)}</span>`;
  }
  const lines = items
    .map((item) => `<li style="margin:2px 0;">${escapeHtml(item)}</li>`)
    .join("");
  return `<ul style="margin:0;padding-left:18px;">${lines}</ul>`;
}

function renderSection(title, rows) {
  const body = rows
    .map((row) => {
      const renderedValue = row.html ? row.value : escapeHtml(row.value);
      return `
      <tr>
        <td style="padding:10px 12px;border-top:1px solid #eee;width:34%;font-weight:600;color:#292929;vertical-align:top;">${escapeHtml(row.label)}</td>
        <td style="padding:10px 12px;border-top:1px solid #eee;color:#1a1a1a;">${renderedValue}</td>
      </tr>`;
    })
    .join("");

  return `
    <div style="margin:18px 0 0;border:1px solid #eadfce;border-radius:12px;overflow:hidden;background:#fff;">
      <div style="padding:11px 14px;background:#faf5ee;border-bottom:1px solid #eadfce;font-weight:700;color:#7f2a12;letter-spacing:.02em;">${escapeHtml(title)}</div>
      <table style="border-collapse:collapse;width:100%;">${body}</table>
    </div>`;
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

  if (!normalized.Osoba_kontaktowa && !normalized.Email && !normalized.Telefon) {
    return res.status(400).json({ success: false, message: "Provide at least one contact detail" });
  }

  if (normalized.needs_invoice && !normalized.company_nip) {
    return res.status(400).json({ success: false, message: "NIP is required when invoice is requested" });
  }

  // Event date/time and min guest rules are handled as soft/hard UX validation on frontend.
  // Backend stays permissive to avoid dropping leads because of temporary UI/state issues.

  const autoWarnings = computeAutoWarnings(normalized);
  const combinedWarnings = [...normalized.warnings_generated, ...autoWarnings].filter(Boolean);
  const leadPriority = computeLeadPriority(normalized);
  const reservationId = buildReservationId();
  const labels = getLocalePack(normalized.locale);
  const soupsForEmail = normalized.menu_soup_choices.length
    ? normalized.menu_soup_choices
    : (normalized.menu_soup_choice ? [normalized.menu_soup_choice] : []);
  const appetizersForEmail = normalized.menu_appetizer_choices.length
    ? normalized.menu_appetizer_choices
    : (normalized.menu_appetizer_choice ? [normalized.menu_appetizer_choice] : []);
  const mainForEmail = normalized.menu_main_choices.length
    ? normalized.menu_main_choices
    : [];

  const localeCode = String(normalized.locale || "").toLowerCase();
  const isEn = localeCode.startsWith("en");
  const isDe = localeCode.startsWith("de");

  const clientTypeMap = {
    company: isEn ? "Company" : isDe ? "Firma" : "Firma",
    "private group": isEn ? "Private group" : isDe ? "Private Gruppe" : "Grupa prywatna",
    private_group: isEn ? "Private group" : isDe ? "Private Gruppe" : "Grupa prywatna",
  };
  const menuModeMap = {
    "standard upto 35": isEn
      ? "Group menu up to 35 guests"
      : isDe
        ? "Gruppenmenu bis 35 Personen"
        : "Menu grupowe do 35 osob",
    standard_upto_35: isEn
      ? "Group menu up to 35 guests"
      : isDe
        ? "Gruppenmenu bis 35 Personen"
        : "Menu grupowe do 35 osob",
    "buffet over 40": isEn
      ? "Buffet / bemars (over 40 guests)"
      : isDe
        ? "Buffet / Bemars (uber 40 Personen)"
        : "Bufet / bemary (powyzej 40 osob)",
    buffet_over_40: isEn
      ? "Buffet / bemars (over 40 guests)"
      : isDe
        ? "Buffet / Bemars (uber 40 Personen)"
        : "Bufet / bemary (powyzej 40 osob)",
    undecided: labels.values.undecided,
  };

  const contactSection = renderSection(labels.sections.contact, [
    { label: labels.labels.client, value: mapValue(normalized.client_type, clientTypeMap) || labels.values.notProvided },
    { label: labels.labels.contactPerson, value: normalized.Osoba_kontaktowa || labels.values.notProvided },
    {
      label: labels.labels.email,
      value: normalized.Email
        ? `<a href="mailto:${escapeHtml(normalized.Email)}" style="color:#8b1a0a;text-decoration:none;">${escapeHtml(normalized.Email)}</a>`
        : labels.values.notProvided,
      html: true,
    },
    { label: labels.labels.phone, value: normalized.Telefon || labels.values.notProvided },
  ]);

  const eventSection = renderSection(labels.sections.event, [
    { label: labels.labels.guests, value: String((normalized.guest_count ?? normalized.Liczba_osob) || labels.values.notProvided) },
    { label: labels.labels.date, value: normalized.event_date || labels.values.notProvided },
    { label: labels.labels.time, value: normalized.event_time || labels.values.notProvided },
  ]);

  const buffetSelected = normalized.menu_mode === "buffet_over_40";
  const menuSection = renderSection(labels.sections.menu, [
    { label: labels.labels.mode, value: mapValue(normalized.menu_mode, menuModeMap) || labels.values.notProvided },
    {
      label: labels.labels.mains,
      value: buffetSelected ? labels.values.buffetInfo : renderList(mainForEmail.map(prettifyToken), labels.values.none),
      html: true,
    },
    {
      label: labels.labels.soups,
      value: buffetSelected ? labels.values.buffetInfo : renderList(soupsForEmail.map(prettifyToken).filter((v) => v && v !== "undecided"), labels.values.none),
      html: true,
    },
    {
      label: labels.labels.appetizers,
      value: buffetSelected ? labels.values.buffetInfo : renderList(appetizersForEmail.map(prettifyToken).filter((v) => v && v !== "undecided"), labels.values.none),
      html: true,
    },
    { label: labels.labels.dietary, value: normalized.dietary_notes || labels.values.none },
    { label: labels.labels.additional, value: normalized.additional_info || labels.values.none },
  ]);

  const warningSection = renderSection(
    labels.sections.warnings,
    combinedWarnings.length
      ? [{ label: labels.labels.warnings, value: renderList(combinedWarnings, labels.values.none), html: true }]
      : [{ label: labels.labels.warnings, value: labels.values.none }]
  );

  const emailHtml = `
    <div style="margin:0;padding:18px;background:#f4f1eb;font-family:Arial,sans-serif;color:#202020;line-height:1.45;">
      <div style="max-width:760px;margin:0 auto;background:#fff;border:1px solid #eadfce;border-radius:14px;overflow:hidden;">
        <div style="padding:16px 18px;background:linear-gradient(135deg,#8b1a0a,#2a0f0a);color:#fef5d8;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <img src="https://browarwyszak.pl/wp-content/uploads/2017/09/browarwyszak_footer.png" alt="Browar Wyszak" width="58" height="58" style="display:block;width:58px;height:58px;object-fit:contain;border-radius:6px;background:#fff;padding:4px;">
          </div>
          <h2 style="margin:0;font-size:22px;line-height:1.3;">${escapeHtml(labels.title)}</h2>
          <p style="margin:8px 0 0;font-size:13px;opacity:.95;">Nowe zapytanie z formularza imprez firmowych. ID: <strong>${escapeHtml(reservationId)}</strong></p>
        </div>
        <div style="padding:16px;">
      ${contactSection}
      ${eventSection}
      ${menuSection}
      ${warningSection}
        </div>
      </div>
    </div>
  `;

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ success: false, message: "Server email key is missing (RESEND_API_KEY)" });
    }

    const fromAddress = process.env.RESEND_FROM || "Browar Wyszak <onboarding@resend.dev>";
    const basePayload = {
      from: fromAddress,
      to: process.env.RESEND_TO || "fpawlun@gmail.com",
      subject: `${labels.subjectPrefix} [${reservationId}] - ${normalized.Osoba_kontaktowa || "Zapytanie"}`,
      html: emailHtml,
    };

    // First try with reply_to.
    let response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...basePayload,
        reply_to: normalized.Email || undefined,
      }),
    });

    // Some providers reject invalid reply_to formatting; retry once without reply_to.
    if (!response.ok) {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(basePayload),
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Resend API failed (${response.status}): ${errText}`);
    }

    return res.status(200).json({ success: true, leadPriority, warnings: combinedWarnings });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
}
