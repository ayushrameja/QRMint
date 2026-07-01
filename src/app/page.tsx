"use client";

import {
  Contact,
  Download,
  ImagePlus,
  Link2,
  Mail,
  MessageSquare,
  Palette,
  Phone,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Type,
  Upload,
  Wifi,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  buildPayload,
  defaultForms,
  defaultStyleSettings,
  qrTypes,
  type ErrorCorrectionLevel,
  type QrFormState,
  type QrStyleSettings,
  type QrType,
  type WifiSecurity,
} from "@/lib/qr";

type QrCodeStylingInstance = {
  append: (container?: HTMLElement) => void;
  update: (options?: QrOptions) => void;
  getRawData: (extension?: "png" | "svg") => Promise<Blob | null>;
};

type QrCodeStylingConstructor = new (options?: QrOptions) => QrCodeStylingInstance;

type QrOptions = {
  type: "svg";
  width: number;
  height: number;
  margin: number;
  data: string;
  image?: string;
  qrOptions: {
    typeNumber: 0;
    errorCorrectionLevel: ErrorCorrectionLevel;
  };
  imageOptions: {
    hideBackgroundDots: boolean;
    imageSize: number;
    margin: number;
    crossOrigin: "anonymous";
    saveAsBlob: boolean;
  };
  dotsOptions: {
    type: "rounded";
    color: string;
    roundSize: boolean;
  };
  cornersSquareOptions: {
    type: "extra-rounded";
    color: string;
  };
  cornersDotOptions: {
    type: "dot";
    color: string;
  };
  backgroundOptions: {
    color: string;
  };
};

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

const typeIcons: Record<QrType, IconComponent> = {
  url: Link2,
  text: Type,
  wifi: Wifi,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  contact: Contact,
};

const errorCorrectionOptions: {
  value: ErrorCorrectionLevel;
  label: string;
}[] = [
  { value: "L", label: "L - 7%" },
  { value: "M", label: "M - 15%" },
  { value: "Q", label: "Q - 25%" },
  { value: "H", label: "H - 30%" },
];

const wifiSecurityOptions: { value: WifiSecurity; label: string }[] = [
  { value: "WPA", label: "WPA/WPA2" },
  { value: "WEP", label: "WEP" },
  { value: "nopass", label: "No password" },
];

export default function Home() {
  const [qrType, setQrType] = useState<QrType>("url");
  const [forms, setForms] = useState<QrFormState>(defaultForms);
  const [settings, setSettings] =
    useState<QrStyleSettings>(defaultStyleSettings);
  const [logoError, setLogoError] = useState("");
  const [isQrReady, setIsQrReady] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrCodeRef = useRef<QrCodeStylingInstance | null>(null);

  const payload = useMemo(() => buildPayload(qrType, forms), [forms, qrType]);
  const previewData = payload.isValid ? payload.value : " ";
  const latestOptionsRef = useRef<QrOptions>(
    createQrOptions(previewData, settings),
  );
  const activeTypeLabel = qrTypes.find((type) => type.id === qrType)?.label;

  useEffect(() => {
    let isActive = true;
    const container = qrContainerRef.current;

    async function loadQrCode() {
      const qrModule = await import("qr-code-styling");
      const QRCodeStyling =
        qrModule.default as unknown as QrCodeStylingConstructor;

      if (!isActive) {
        return;
      }

      const qrCode = new QRCodeStyling(latestOptionsRef.current);
      qrCodeRef.current = qrCode;

      if (container) {
        container.innerHTML = "";
        qrCode.append(container);
      }

      setIsQrReady(true);
    }

    loadQrCode();

    return () => {
      isActive = false;
      qrCodeRef.current = null;

      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    latestOptionsRef.current = createQrOptions(previewData, settings);
    qrCodeRef.current?.update(latestOptionsRef.current);
  }, [previewData, settings]);

  function updateForm<T extends QrType, K extends keyof QrFormState[T]>(
    type: T,
    key: K,
    value: QrFormState[T][K],
  ) {
    setForms((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [key]: value,
      },
    }));
  }

  function updateSettings<K extends keyof QrStyleSettings>(
    key: K,
    value: QrStyleSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoError("Use an image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateSettings("logoDataUrl", String(reader.result ?? ""));
      setLogoError("");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function resetCreator() {
    setQrType("url");
    setForms(defaultForms);
    setSettings(defaultStyleSettings);
    setLogoError("");
  }

  async function downloadQr(extension: "png" | "svg") {
    if (!payload.isValid || !qrCodeRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      const blob = await qrCodeRef.current.getRawData(extension);

      if (!blob) {
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `qrmint-${qrType}.${extension}`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf8] text-slate-950">
      <header className="border-b border-slate-200 bg-white/92">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
              <QrCode className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-normal text-slate-950">
                QRMint
              </h1>
              <p className="text-sm text-slate-500">Quick QR creator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetCreator}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </header>

      <div className="mx-auto grid min-w-0 max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:px-8">
        <section className="min-w-0 space-y-5">
          <Panel
            icon={<QrCode className="h-5 w-5" />}
            title="Content"
            action={
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {activeTypeLabel}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
              {qrTypes.map((type) => {
                const Icon = typeIcons[type.id];
                const isActive = qrType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setQrType(type.id)}
                    className={`flex h-12 min-w-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{type.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">{renderQrForm(qrType, forms, updateForm)}</div>
          </Panel>

          <Panel
            icon={<Palette className="h-5 w-5" />}
            title="Style"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                {settings.errorCorrection}
              </span>
            }
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ColorControl
                label="Foreground"
                value={settings.foreground}
                onChange={(value) => updateSettings("foreground", value)}
              />
              <ColorControl
                label="Background"
                value={settings.background}
                onChange={(value) => updateSettings("background", value)}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <RangeControl
                label="Size"
                value={settings.size}
                min={220}
                max={360}
                step={10}
                suffix="px"
                onChange={(value) => updateSettings("size", value)}
              />
              <RangeControl
                label="Margin"
                value={settings.margin}
                min={0}
                max={32}
                step={2}
                suffix="px"
                onChange={(value) => updateSettings("margin", value)}
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <SelectField
                label="Error correction"
                value={settings.errorCorrection}
                onChange={(value) =>
                  updateSettings(
                    "errorCorrection",
                    value as ErrorCorrectionLevel,
                  )
                }
                options={errorCorrectionOptions}
              />
              <LogoControl
                hasLogo={Boolean(settings.logoDataUrl)}
                error={logoError}
                onUpload={handleLogoUpload}
                onRemove={() => {
                  updateSettings("logoDataUrl", "");
                  setLogoError("");
                }}
              />
            </div>
          </Panel>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-5 lg:self-start">
          <Panel
            icon={<SlidersHorizontal className="h-5 w-5" />}
            title="Preview"
            action={
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  payload.isValid
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {payload.isValid ? "Ready" : "Needs input"}
              </span>
            }
          >
            <div className="flex aspect-square min-h-[280px] items-center justify-center rounded-lg border border-slate-200 bg-[#fbfdfc] p-5">
              <div
                className="qr-preview relative aspect-square max-h-full max-w-full"
                style={{ width: settings.size }}
              >
                <div ref={qrContainerRef} className="h-full w-full" />
                {(!payload.isValid || !isQrReady) && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/92 p-4 text-center text-sm font-medium text-slate-600">
                    {isQrReady ? payload.errorMessage : "Preparing preview"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => downloadQr("png")}
                disabled={!payload.isValid || !isQrReady || isDownloading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Download className="h-4 w-4" />
                PNG
              </button>
              <button
                type="button"
                onClick={() => downloadQr("svg")}
                disabled={!payload.isValid || !isQrReady || isDownloading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Download className="h-4 w-4" />
                SVG
              </button>
            </div>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-950 p-3">
              <code className="block max-h-32 overflow-auto break-all text-xs leading-5 text-emerald-100">
                {payload.isValid ? payload.value : payload.errorMessage}
              </code>
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function createQrOptions(data: string, settings: QrStyleSettings): QrOptions {
  return {
    type: "svg",
    width: settings.size,
    height: settings.size,
    margin: settings.margin,
    data,
    image: settings.logoDataUrl || undefined,
    qrOptions: {
      typeNumber: 0,
      errorCorrectionLevel: settings.errorCorrection,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.24,
      margin: 6,
      crossOrigin: "anonymous",
      saveAsBlob: true,
    },
    dotsOptions: {
      type: "rounded",
      color: settings.foreground,
      roundSize: true,
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: settings.foreground,
    },
    cornersDotOptions: {
      type: "dot",
      color: settings.foreground,
    },
    backgroundOptions: {
      color: settings.background,
    },
  };
}

function renderQrForm(
  qrType: QrType,
  forms: QrFormState,
  updateForm: <T extends QrType, K extends keyof QrFormState[T]>(
    type: T,
    key: K,
    value: QrFormState[T][K],
  ) => void,
) {
  switch (qrType) {
    case "url":
      return (
        <TextField
          label="URL"
          value={forms.url.value}
          placeholder="qrmint.app"
          onChange={(value) => updateForm("url", "value", value)}
        />
      );
    case "text":
      return (
        <TextAreaField
          label="Text"
          value={forms.text.value}
          placeholder="Text to encode"
          onChange={(value) => updateForm("text", "value", value)}
        />
      );
    case "wifi":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Network name"
            value={forms.wifi.ssid}
            placeholder="Cafe Guest"
            onChange={(value) => updateForm("wifi", "ssid", value)}
          />
          <SelectField
            label="Security"
            value={forms.wifi.security}
            onChange={(value) =>
              updateForm("wifi", "security", value as WifiSecurity)
            }
            options={wifiSecurityOptions}
          />
          <TextField
            label="Password"
            type="password"
            value={forms.wifi.password}
            placeholder="Password"
            disabled={forms.wifi.security === "nopass"}
            onChange={(value) => updateForm("wifi", "password", value)}
          />
          <ToggleField
            label="Hidden network"
            checked={forms.wifi.hidden}
            onChange={(value) => updateForm("wifi", "hidden", value)}
          />
        </div>
      );
    case "email":
      return (
        <div className="grid gap-4">
          <TextField
            label="Email"
            type="email"
            value={forms.email.address}
            placeholder="hello@example.com"
            onChange={(value) => updateForm("email", "address", value)}
          />
          <TextField
            label="Subject"
            value={forms.email.subject}
            placeholder="Hello"
            onChange={(value) => updateForm("email", "subject", value)}
          />
          <TextAreaField
            label="Body"
            value={forms.email.body}
            placeholder="Message"
            onChange={(value) => updateForm("email", "body", value)}
          />
        </div>
      );
    case "phone":
      return (
        <TextField
          label="Phone"
          type="tel"
          value={forms.phone.number}
          placeholder="+91 99999 99999"
          onChange={(value) => updateForm("phone", "number", value)}
        />
      );
    case "sms":
      return (
        <div className="grid gap-4">
          <TextField
            label="Phone"
            type="tel"
            value={forms.sms.number}
            placeholder="+91 99999 99999"
            onChange={(value) => updateForm("sms", "number", value)}
          />
          <TextAreaField
            label="Message"
            value={forms.sms.body}
            placeholder="Message"
            onChange={(value) => updateForm("sms", "body", value)}
          />
        </div>
      );
    case "contact":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Full name"
            value={forms.contact.fullName}
            placeholder="Ayush Rameja"
            onChange={(value) => updateForm("contact", "fullName", value)}
          />
          <TextField
            label="Company"
            value={forms.contact.company}
            placeholder="QRMint"
            onChange={(value) => updateForm("contact", "company", value)}
          />
          <TextField
            label="Title"
            value={forms.contact.title}
            placeholder="Founder"
            onChange={(value) => updateForm("contact", "title", value)}
          />
          <TextField
            label="Phone"
            type="tel"
            value={forms.contact.phone}
            placeholder="+91 99999 99999"
            onChange={(value) => updateForm("contact", "phone", value)}
          />
          <TextField
            label="Email"
            type="email"
            value={forms.contact.email}
            placeholder="hello@example.com"
            onChange={(value) => updateForm("contact", "email", value)}
          />
          <TextField
            label="Website"
            value={forms.contact.website}
            placeholder="qrmint.app"
            onChange={(value) => updateForm("contact", "website", value)}
          />
        </div>
      );
  }
}

function Panel({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            {icon}
          </span>
          <h2 className="truncate text-base font-semibold text-slate-950">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "password";
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        suppressHydrationWarning
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        suppressHydrationWarning
        className="min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        suppressHydrationWarning
        className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        <span>{label}</span>
        <span className="tabular-nums text-slate-500">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        suppressHydrationWarning
        className="accent-emerald-600 h-2 w-full cursor-pointer"
      />
    </label>
  );
}

function ColorControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="flex h-11 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          suppressHydrationWarning
          className="h-full w-14 cursor-pointer border-0 bg-transparent p-1"
          title={`${label} color`}
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          suppressHydrationWarning
          className="min-w-0 flex-1 border-0 px-3 text-sm font-medium uppercase text-slate-800 outline-none"
        />
      </div>
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 shadow-sm">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        suppressHydrationWarning
        className="h-5 w-5 accent-emerald-600"
      />
    </label>
  );
}

function LogoControl({
  hasLogo,
  error,
  onUpload,
  onRemove,
}: {
  hasLogo: boolean;
  error: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        Logo
      </span>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
          {hasLogo ? (
            <ImagePlus className="h-4 w-4" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="truncate">{hasLogo ? "Replace" : "Upload"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            suppressHydrationWarning
            className="sr-only"
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          disabled={!hasLogo}
          title="Remove logo"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm font-medium text-amber-700">{error}</p>}
    </div>
  );
}
