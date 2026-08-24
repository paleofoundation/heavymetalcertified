export {} // module scope — keeps locals out of the shared inline-script global scope

// Application intake for /apply. The form lives inline in content/apply.md
// ([data-apply-form]); this script, shipped site-wide by the headless ApplyForm
// component, wires it and no-ops on every page without that root.
//
// There is no application-intake serverless backend on this deployment (the sibling
// /api/corrections endpoint 404s and the corrections form itself falls back to email),
// so this composes a structured application and hands it to the applicant two ways at
// once: it opens their mail client pre-addressed to the program intake, and it reveals
// the same application as copyable text with the intake address in plain sight, so a
// webmail user who has no mail-client handler can still send it. The application never
// routes to paleofoundation.com. If a real intake endpoint is added later, POST it from
// bind() before the mailto step; the composed payload is already assembled here.

const INTAKE = "karen@paleofoundation.com"
const READY_ATTR = "data-apply-ready"

const TERM_LABEL: Record<string, string> = {
  "1": "1 year",
  "2": "2 years (10% multi-year discount)",
  "3": "3 years (multi-year discount)",
}
const RUSH_LABEL: Record<string, string> = {
  "0": "Standard (4 to 8 weeks)",
  "5000": "Rush, 10 business days (+$5,000)",
  "10000": "Rush, 3 business days (+$10,000)",
}

function setStatus(form: HTMLFormElement, kind: "idle" | "ok" | "error", text: string) {
  const status = form.querySelector("[data-apply-status]") as HTMLElement | null
  if (!status) return
  status.dataset.state = kind
  status.textContent = text
}

function field(form: HTMLFormElement, name: string): string {
  const el = form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | null
  return el ? el.value.trim() : ""
}

function checkedRadio(form: HTMLFormElement, name: string): string {
  const el = form.querySelector(`[name="${name}"]:checked`) as HTMLInputElement | null
  return el ? el.value : ""
}

// Reads the on-page fee estimator (if present) so the applicant does not re-enter what
// they already selected above. All three are optional; absence is reported plainly.
function feeContext(): { band: string; term: string; rush: string; estimate: string } {
  const revSel = document.querySelector("[data-fee-revenue]") as HTMLSelectElement | null
  const termSel = document.querySelector("[data-fee-term]") as HTMLSelectElement | null
  const rushSel = document.querySelector("[data-fee-rush]") as HTMLSelectElement | null
  const result = document.querySelector("[data-fee-result]") as HTMLElement | null
  const band = revSel?.options[revSel.selectedIndex]?.text?.replace(/\s+/g, " ").trim() || "not selected"
  const term = termSel ? TERM_LABEL[termSel.value] || termSel.value : "not selected"
  const rush = rushSel ? RUSH_LABEL[rushSel.value] || rushSel.value : "not selected"
  // The estimator headline is the first dollar figure in the result panel.
  const estimate = result ? (result.innerText.match(/\$[\d,]+/)?.[0] ?? "") : ""
  return { band, term, rush, estimate }
}

function compose(form: HTMLFormElement) {
  const company = field(form, "company")
  const contact = field(form, "contact")
  const email = field(form, "email")
  const website = field(form, "website")
  const products = field(form, "products")
  const labs = checkedRadio(form, "labs")
  const notes = field(form, "notes")
  const fee = feeContext()

  const subject = `[HMTc Application] ${company}`
  const lines = [
    "Heavy Metal Tested & Certified — application",
    "",
    `Company / brand: ${company}`,
    `Contact name: ${contact}`,
    `Contact email: ${email}`,
    `Website: ${website || "—"}`,
    "",
    "Products / subcategories to certify:",
    products,
    "",
    `Already hold recent accredited (ISO/IEC 17025) lab results: ${labs === "yes" ? "Yes" : "No, or not sure"}`,
    "",
    "Fee context (from the on-page estimator):",
    `  Revenue band: ${fee.band}`,
    `  Term: ${fee.term}`,
    `  Processing: ${fee.rush}`,
    ...(fee.estimate ? [`  Estimated fee shown: ${fee.estimate}`] : []),
    "",
    "Notes:",
    notes || "—",
    "",
    "---",
    "Submitted from heavymetalcertified.com/apply",
  ]
  return { subject, body: lines.join("\n") }
}

function reveal(form: HTMLFormElement, subject: string, body: string) {
  const box = form.querySelector("[data-apply-review]") as HTMLElement | null
  const ta = form.querySelector("[data-apply-review-text]") as HTMLTextAreaElement | null
  if (ta) ta.value = `To: ${INTAKE}\nSubject: ${subject}\n\n${body}`
  if (box) box.style.display = "block"
}

function bind(form: HTMLFormElement) {
  if (form.dataset.applyReady === "true") return
  form.dataset.applyReady = "true"

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    const company = field(form, "company")
    const contact = field(form, "contact")
    const email = field(form, "email")
    const products = field(form, "products")
    const labs = checkedRadio(form, "labs")

    if (!company || !contact || !email || !products || !labs) {
      setStatus(
        form,
        "error",
        "Please give the brand name, a contact name and email, the products to certify, and whether you already hold recent lab results.",
      )
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus(form, "error", "That contact email does not look right. Check it and try again.")
      return
    }

    const { subject, body } = compose(form)
    reveal(form, subject, body)
    setStatus(
      form,
      "ok",
      `Your email app should open with the application ready to send to ${INTAKE}. If it did not open, copy the application below and send it to ${INTAKE}.`,
    )
    // Open the applicant's mail client pre-addressed and pre-filled.
    window.location.href = `mailto:${INTAKE}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  })

  const copyBtn = form.querySelector("[data-apply-copy]") as HTMLButtonElement | null
  copyBtn?.addEventListener("click", async () => {
    const ta = form.querySelector("[data-apply-review-text]") as HTMLTextAreaElement | null
    if (!ta) return
    try {
      await navigator.clipboard.writeText(ta.value)
      copyBtn.textContent = "Copied"
    } catch {
      ta.focus()
      ta.select()
      try {
        document.execCommand("copy")
        copyBtn.textContent = "Copied"
      } catch {
        copyBtn.textContent = "Select all and copy"
      }
    }
    setTimeout(() => {
      copyBtn.textContent = "Copy application"
    }, 2500)
  })
}

function setupAll() {
  document
    .querySelectorAll(`form[data-apply-form]:not([${READY_ATTR}=true])`)
    .forEach((form) => bind(form as HTMLFormElement))
}

document.addEventListener("nav", setupAll)
queueMicrotask(setupAll)
