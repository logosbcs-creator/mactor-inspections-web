import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Inspector MacTor / FixMyProperty",
  description: "How MacTor Technologies Inc. handles data in Inspector MacTor, FixMyProperty and the MacTor Asistente.",
};

const h2 = { fontSize: 18, margin: "28px 0 8px" } as const;

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 16px 64px", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", lineHeight: 1.6, color: "#1f2430", background: "#fff" }}>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: "#5b6475", marginTop: 0 }}>MacTor Technologies Inc. · Last updated November 21, 2026</p>

      <p>
        This policy covers Inspector MacTor (inspector.fixmyproperty.ca), FixMyProperty and MacTor Construction services,
        and the internal MacTor Asistente, operated by MacTor Technologies Inc. in Ontario, Canada.
      </p>

      <h2 style={h2}>Information we collect</h2>
      <p>
        When you request an inspection or estimate we collect your name, contact details, property address, the description
        of the problem and the photos you upload. We use them to prepare your report and estimate, to contact you and to
        invoice completed work.
      </p>

      <h2 style={h2}>MacTor Asistente and Google user data</h2>
      <p>
        MacTor Asistente is an internal tool used only by the business owner. When the owner connects his own Gmail
        accounts, the app reads messages (scope <code>gmail.readonly</code>) to summarize them and alert him about
        important mail, and creates drafts or sends messages (scope <code>gmail.compose</code>) only after he explicitly
        confirms each one. Gmail data is processed to provide these features to the owner only; it is not sold, not used
        for advertising and not shared with third parties except the AI service provider (Anthropic) that processes it to
        generate summaries on our behalf. OAuth tokens are stored encrypted and can be revoked at any time from
        myaccount.google.com/permissions.
      </p>
      <p>
        The use and transfer of information received from Google APIs adheres to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>,
        including the Limited Use requirements.
      </p>

      <h2 style={h2}>Service providers</h2>
      <p>
        We use trusted providers to run the service: hosting (Vercel, Railway), database (Neon), image storage (Cloudinary),
        messaging (Twilio, Resend), payments (Stripe) and AI processing (Anthropic, OpenAI). They process data only to
        provide their service to us.
      </p>

      <h2 style={h2}>Retention and your rights</h2>
      <p>
        We keep records as long as needed for the work and for legal and tax obligations. You can ask to access, correct or
        delete your information by writing to <a href="mailto:julio@mactor.ca">julio@mactor.ca</a>.
      </p>

      <h2 style={h2}>Contact</h2>
      <p>MacTor Technologies Inc. · Toronto, Ontario · <a href="mailto:julio@mactor.ca">julio@mactor.ca</a></p>
    </main>
  );
}
