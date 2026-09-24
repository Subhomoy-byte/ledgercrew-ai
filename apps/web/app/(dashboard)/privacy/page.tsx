const TOC = [
  ["p1", "Who we are"],
  ["p2", "Information we collect"],
  ["p3", "How we use your information"],
  ["p4", "AI processing & automated decisions"],
  ["p5", "Who we share data with"],
  ["p6", "The cross-business trust score"],
  ["p7", "Data retention"],
  ["p8", "Security"],
  ["p9", "Your rights"],
  ["p10", "Children's privacy"],
  ["p11", "Changes to this policy"],
  ["p12", "Contact & grievance officer"],
] as const;

function Section({
  id,
  num,
  title,
  children,
}: {
  id: string;
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-8 scroll-mt-[90px]">
      <h3 className="mb-3 flex items-baseline gap-2.5 font-serif text-lg font-medium">
        <span className="font-mono text-[13px] font-normal text-amber">{num}</span>
        {title}
      </h3>
      <div className="space-y-2.5 text-[13.5px] leading-relaxed text-ink-soft [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-[780px] rounded-[16px] border border-line bg-surface p-10 shadow-sm sm:p-[46px]">
      <h1 className="font-serif text-[26px] font-medium">Privacy Policy</h1>
      <div className="mb-7 mt-1 text-[12.5px] text-ink-soft">
        Last updated: 17 September 2026 · Applies to LedgerCrew AI (the &quot;Service&quot;)
      </div>

      <div className="mb-9 rounded-r-[10px] border-l-[3px] border-amber bg-amber-soft px-[18px] py-3.5 text-[12.5px]">
        This policy is written in plain language wherever possible because
        you&apos;re trusting us with your business&apos;s financial data.
        It&apos;s a working draft for the product&apos;s current build — have
        it reviewed by counsel before treating it as final for a live launch.
      </div>

      <div className="mb-9 rounded-xl bg-surface-2 px-[22px] py-[18px]">
        <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          On this page
        </div>
        <ol className="columns-1 space-y-0 pl-5 text-[13px] leading-[2] text-ink-soft sm:columns-2">
          {TOC.map(([id, title]) => (
            <li key={id}>
              <a href={`#${id}`} className="transition-colors hover:text-amber">
                {title}
              </a>
            </li>
          ))}
        </ol>
      </div>

      <Section id="p1" num="01" title="Who we are">
        <p>
          LedgerCrew AI (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;)
          provides an AI-agent back-office — invoice reading, GST compliance
          drafting, payment collections, and cash-flow forecasting — for
          small businesses and freelancers in India. This policy explains
          what we collect through the Service, why, and what rights you have
          over it.
        </p>
      </Section>

      <Section id="p2" num="02" title="Information we collect">
        <ul>
          <li>
            <strong>Account &amp; business information:</strong> your name,
            business name, GSTIN, email, phone number, and password.
          </li>
          <li>
            <strong>Financial &amp; transaction data:</strong> invoices and
            receipts you upload or forward (including data extracted from
            them — amounts, dates, vendor/client names, HSN codes), payment
            status, and client contact details used for collections.
          </li>
          <li>
            <strong>Communications data:</strong> messages sent via WhatsApp
            intake, and voice notes submitted for transcription (processed
            for that request; see Section 4).
          </li>
          <li>
            <strong>Usage &amp; device data:</strong> log data, IP address,
            browser type, and how you interact with the dashboard, collected
            automatically.
          </li>
        </ul>
      </Section>

      <Section id="p3" num="03" title="How we use your information">
        <ul>
          <li>
            To operate the five crew agents — Intake, Compliance,
            Collections, Guardrail, and Cash-flow — on your behalf.
          </li>
          <li>To prepare GST filing drafts and flag compliance issues.</li>
          <li>
            To send payment reminders you&apos;ve configured, at the tone and
            cadence you approve.
          </li>
          <li>
            To forecast your cash position and surface it in your dashboard
            and calendar.
          </li>
          <li>To maintain and improve the Service&apos;s reliability and security.</li>
        </ul>
        <p>
          <strong>
            We do not use your invoice or client data to train third-party AI
            models
          </strong>
          , and we do not sell your data to advertisers.
        </p>
      </Section>

      <Section id="p4" num="04" title="AI processing & automated decisions">
        <p>
          Reading an invoice, drafting a GST return, or writing a reminder
          involves sending the relevant text or image to an AI model (ours
          or a sub-processor&apos;s — see Section 5) for processing.
          Guardrail review sits between every drafted reminder and its
          delivery, and you can set any agent&apos;s output to require your
          approval before it takes effect. You may request a human review of
          any automated decision that affects your account by contacting us
          (Section 12).
        </p>
      </Section>

      <Section id="p5" num="05" title="Who we share data with">
        <p>
          We share data only with the sub-processors needed to run the
          Service, each under a data processing agreement:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database, authentication, and file
            storage.
          </li>
          <li>
            <strong>Anthropic (Claude) and Groq</strong> — AI processing for
            document extraction, drafting, and voice transcription.
          </li>
          <li>
            <strong>Twilio</strong> — WhatsApp message delivery for invoice
            intake and reminders.
          </li>
          <li>
            <strong>Resend</strong> — transactional email delivery.
          </li>
        </ul>
        <p>
          We disclose data beyond this list only if required by law, or with
          your consent.
        </p>
      </Section>

      <Section id="p6" num="06" title="The cross-business trust score">
        <p>
          To estimate a client&apos;s payment reliability, the Service may
          use aggregated, anonymized payment-timing patterns from across
          businesses using LedgerCrew AI. This never includes your invoice
          contents, amounts tied to your identity, or any personally
          identifying detail about you or your clients — only de-identified
          statistical patterns. You can opt your business&apos;s data out of
          contributing to this aggregate at any time from Settings without
          losing access to the feature itself.
        </p>
      </Section>

      <Section id="p7" num="07" title="Data retention">
        <p>
          We retain your account and financial data for as long as your
          account is active, and for a reasonable period after closure to
          meet tax and accounting record-keeping obligations under Indian
          law. You can request earlier deletion under Section 9, subject to
          those legal retention requirements.
        </p>
      </Section>

      <Section id="p8" num="08" title="Security">
        <p>
          Data is isolated per business using row-level access controls,
          encrypted in transit, and access to production data is limited to
          what&apos;s operationally necessary. No system is perfectly
          secure, and we&apos;ll notify affected users promptly in the event
          of a breach involving their data.
        </p>
      </Section>

      <Section id="p9" num="09" title="Your rights">
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023, and
          applicable data protection law generally, you have the right to:
        </p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>
            Request erasure of your data, subject to legal retention
            obligations.
          </li>
          <li>
            Withdraw consent for optional processing (such as the
            trust-score aggregate) at any time.
          </li>
          <li>
            Lodge a grievance with our Grievance Officer (Section 12) or the
            relevant data protection authority.
          </li>
        </ul>
      </Section>

      <Section id="p10" num="10" title="Children's privacy">
        <p>
          The Service is intended for business owners and is not directed at
          anyone under 18. We don&apos;t knowingly collect data from minors.
        </p>
      </Section>

      <Section id="p11" num="11" title="Changes to this policy">
        <p>
          We&apos;ll update the &quot;Last updated&quot; date above whenever
          this policy changes, and notify you by email for any change that
          materially affects how your data is used.
        </p>
      </Section>

      <Section id="p12" num="12" title="Contact & grievance officer">
        <div className="rounded-xl bg-surface-2 px-[22px] py-5 leading-[1.8]">
          <strong>LedgerCrew AI</strong>
          <br />
          Grievance Officer: [Name to be appointed]
          <br />
          Email: privacy@ledgercrew.ai
          <br />
          We aim to acknowledge privacy requests within 7 business days.
        </div>
      </Section>
    </div>
  );
}
