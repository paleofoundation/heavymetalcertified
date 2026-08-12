type ReadinessValues = {
  category: string
  consumer: string
  form: string
  portfolio: string
  evidence: string
  intent: string
}

function value(form: HTMLFormElement, name: keyof ReadinessValues): string {
  return String(new FormData(form).get(name) ?? "")
}

function setText(root: HTMLElement, selector: string, text: string) {
  const element = root.querySelector<HTMLElement>(selector)
  if (element) element.textContent = text
}

function setupReadinessCheck() {
  const root = document.querySelector<HTMLElement>("[data-readiness-check]")
  if (!root || root.dataset.ready === "true") return

  const form = root.querySelector<HTMLFormElement>("[data-readiness-form]")
  const result = root.querySelector<HTMLElement>("[data-readiness-result]")
  if (!form || !result) return
  root.dataset.ready = "true"

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return

    const answers: ReadinessValues = {
      category: value(form, "category"),
      consumer: value(form, "consumer"),
      form: value(form, "form"),
      portfolio: value(form, "portfolio"),
      evidence: value(form, "evidence"),
      intent: value(form, "intent"),
    }

    const categoryUncertain = answers.category.startsWith("Another") || answers.form === "uncertain"
    const evidenceStrong = answers.evidence === "full"
    const evidencePartial = answers.evidence === "partial"
    const portfolioLarge = answers.portfolio === "large" || answers.portfolio === "uncertain"
    const vulnerableConsumer = answers.consumer === "infant" || answers.consumer === "child"

    setText(
      result,
      "[data-readiness-category-state]",
      categoryUncertain
        ? "Scope confirmation required; no formal submission should begin until the product form is resolved."
        : `${answers.category}: Private Readiness only. Published technical material does not by itself open formal certification.`,
    )
    setText(
      result,
      "[data-readiness-reuse]",
      evidenceStrong
        ? "Potentially high. Each result still needs laboratory, method, sensitivity, lot, basis, custody, and recency review."
        : evidencePartial
          ? "Potentially partial. Qualified analytes or lots may reduce duplication after record-level review."
          : "Limited until complete reports are reviewed; supplier or internal records can still inform planning.",
    )
    setText(
      result,
      "[data-readiness-gap]",
      evidenceStrong
        ? "Confirm comparability and identify only the missing analytes, lots, metadata, or reflex work."
        : evidencePartial
          ? "Complete the missing portion of the ten-analyte panel and any required lot or custody record."
          : "Plan for a complete finished-product panel and the records needed to establish product and lot identity.",
    )
    setText(
      result,
      "[data-readiness-timing]",
      categoryUncertain || portfolioLarge
        ? "Scope and portfolio mapping comes first; timing is quoted only after those dependencies are resolved."
        : evidenceStrong
          ? "Readiness review may be shorter when records are complete; the formal 4–8 week target starts only after an accepted complete submission and samples."
          : "Allow time for scope, evidence review, sampling, laboratory work, and any confirmation or intervention before a formal decision.",
    )
    setText(
      result,
      "[data-readiness-cost]",
      portfolioLarge
        ? "Distinct formulations, lot count, matrix-specific methods, missing analytes, logistics, confirmation, and portfolio sequencing."
        : "Existing-evidence acceptance, missing analytes, required lots, method sensitivity, logistics, and any confirmation or remediation.",
    )
    setText(
      result,
      "[data-readiness-note]",
      answers.intent === "certification"
        ? "You selected formal certification. The current category map does not authorize a formal fee or sample submission yet; use this readiness map to obtain written scope, gate status, consequence rules, and an itemized quote first."
        : answers.intent === "remediation"
          ? "Use Private Readiness to distinguish a planning gap from a possible legal exceedance. Confidential Remediation is a pre-certification route only when the product remains within applicable legal limits."
          : vulnerableConsumer
            ? "The intended consumer requires careful product-form, basis, method-sensitivity, and regulatory mapping before any decision is made."
            : "This is a planning result, not an assurance of conformity, safety, or future certification.",
    )

    result.hidden = false
    result.scrollIntoView({ behavior: "smooth", block: "start" })
  })

  form.addEventListener("reset", () => {
    result.hidden = true
  })
}

document.addEventListener("nav", setupReadinessCheck)
setupReadinessCheck()
