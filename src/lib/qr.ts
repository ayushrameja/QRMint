export type QrType =
  | "url"
  | "text"
  | "wifi"
  | "email"
  | "phone"
  | "sms"
  | "contact";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export type WifiSecurity = "WPA" | "WEP" | "nopass";

export type PayloadResult = {
  value: string;
  isValid: boolean;
  errorMessage: string;
};

export type QrStyleSettings = {
  foreground: string;
  background: string;
  size: number;
  margin: number;
  errorCorrection: ErrorCorrectionLevel;
  logoDataUrl: string;
};

export type QrFormState = {
  url: {
    value: string;
  };
  text: {
    value: string;
  };
  wifi: {
    ssid: string;
    password: string;
    security: WifiSecurity;
    hidden: boolean;
  };
  email: {
    address: string;
    subject: string;
    body: string;
  };
  phone: {
    number: string;
  };
  sms: {
    number: string;
    body: string;
  };
  contact: {
    fullName: string;
    company: string;
    title: string;
    phone: string;
    email: string;
    website: string;
  };
};

export const qrTypes: { id: QrType; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "sms", label: "SMS" },
  { id: "contact", label: "Contact" },
];

export const defaultForms: QrFormState = {
  url: {
    value: "google.com",
  },
  text: {
    value: "Made with QRMint",
  },
  wifi: {
    ssid: "QRMint Guest",
    password: "minted-quickly",
    security: "WPA",
    hidden: false,
  },
  email: {
    address: "hello@qrmint.app",
    subject: "Hello from QRMint",
    body: "",
  },
  phone: {
    number: "+919999999999",
  },
  sms: {
    number: "+919999999999",
    body: "Hello from QRMint",
  },
  contact: {
    fullName: "QRMint Studio",
    company: "QRMint",
    title: "QR Creator",
    phone: "+919999999999",
    email: "hello@qrmint.app",
    website: "qrmint.app",
  },
};

export const defaultStyleSettings: QrStyleSettings = {
  foreground: "#111827",
  background: "#ffffff",
  size: 320,
  margin: 16,
  errorCorrection: "Q",
  logoDataUrl: "",
};

export function buildPayload(
  type: QrType,
  forms: QrFormState,
): PayloadResult {
  switch (type) {
    case "url":
      return buildUrlPayload(forms.url.value);
    case "text":
      return buildTextPayload(forms.text.value);
    case "wifi":
      return buildWifiPayload(forms.wifi);
    case "email":
      return buildEmailPayload(forms.email);
    case "phone":
      return buildPhonePayload(forms.phone.number);
    case "sms":
      return buildSmsPayload(forms.sms);
    case "contact":
      return buildContactPayload(forms.contact);
  }
}

function buildUrlPayload(value: string): PayloadResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return invalid("Enter a URL.");
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  return valid(hasScheme ? trimmed : `https://${trimmed}`);
}

function buildTextPayload(value: string): PayloadResult {
  if (!value.trim()) {
    return invalid("Enter text.");
  }

  return valid(value);
}

function buildWifiPayload(fields: QrFormState["wifi"]): PayloadResult {
  const ssid = fields.ssid.trim();

  if (!ssid) {
    return invalid("Enter a network name.");
  }

  const password = fields.security === "nopass" ? "" : fields.password;

  return valid(
    `WIFI:T:${fields.security};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(
      password,
    )};H:${fields.hidden ? "true" : "false"};;`,
  );
}

function buildEmailPayload(fields: QrFormState["email"]): PayloadResult {
  const address = fields.address.trim();

  if (!address || !address.includes("@")) {
    return invalid("Enter an email address.");
  }

  const query = [
    fields.subject.trim()
      ? `subject=${encodeURIComponent(fields.subject.trim())}`
      : "",
    fields.body.trim() ? `body=${encodeURIComponent(fields.body)}` : "",
  ]
    .filter(Boolean)
    .join("&");

  return valid(`mailto:${address}${query ? `?${query}` : ""}`);
}

function buildPhonePayload(value: string): PayloadResult {
  const number = value.trim().replace(/\s+/g, "");

  if (!number) {
    return invalid("Enter a phone number.");
  }

  return valid(`tel:${number}`);
}

function buildSmsPayload(fields: QrFormState["sms"]): PayloadResult {
  const number = fields.number.trim().replace(/\s+/g, "");

  if (!number) {
    return invalid("Enter a phone number.");
  }

  return valid(
    `sms:${number}${fields.body.trim() ? `?body=${encodeURIComponent(fields.body)}` : ""}`,
  );
}

function buildContactPayload(fields: QrFormState["contact"]): PayloadResult {
  const fullName = fields.fullName.trim();
  const phone = fields.phone.trim();
  const email = fields.email.trim();

  if (!fullName && !phone && !email) {
    return invalid("Enter a name, phone, or email.");
  }

  const { firstName, lastName } = splitName(fullName);
  const website = fields.website.trim()
    ? normalizeWebsite(fields.website.trim())
    : "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVcard(lastName)};${escapeVcard(firstName)};;;`,
    fullName ? `FN:${escapeVcard(fullName)}` : "",
    fields.company.trim() ? `ORG:${escapeVcard(fields.company.trim())}` : "",
    fields.title.trim() ? `TITLE:${escapeVcard(fields.title.trim())}` : "",
    phone ? `TEL;TYPE=CELL:${escapeVcard(phone.replace(/\s+/g, ""))}` : "",
    email ? `EMAIL;TYPE=INTERNET:${escapeVcard(email)}` : "",
    website ? `URL:${escapeVcard(website)}` : "",
    "END:VCARD",
  ].filter(Boolean);

  return valid(lines.join("\n"));
}

function normalizeWebsite(value: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "", lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "",
  };
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function valid(value: string): PayloadResult {
  return {
    value,
    isValid: true,
    errorMessage: "",
  };
}

function invalid(errorMessage: string): PayloadResult {
  return {
    value: "",
    isValid: false,
    errorMessage,
  };
}
