export {} // module scope — keeps locals out of the global namespace

// Binds [data-hmi-correction-form] forms to /api/corrections. Forms ship in
// markdown (wiki/contact.md, wiki/errata.md); this script wires submission,
// shows inline status messages, and disables the submit button while in flight.

type CorrectionResponse = {
  ok?: boolean
  id?: string
  received_at?: string
  acknowledgement_target?: string
  message?: string
  error?: string
}

const ENDPOINT_ATTR = "data-hmi-correction-form"
const READY_ATTR = "data-hmi-correction-ready"
const TIMEOUT_MS = 20_000

function setStatus(form: HTMLFormElement, kind: "idle" | "pending" | "ok" | "error", text: string) {
  const status = form.querySelector("[data-hmi-correction-status]") as HTMLElement | null
  if (!status) return
  status.dataset.state = kind
  status.textContent = text
}

function disable(form: HTMLFormElement, disabled: boolean) {
  const button = form.querySelector(
    "button[type=submit], input[type=submit]",
  ) as HTMLButtonElement | HTMLInputElement | null
  if (button) button.disabled = disabled
}

async function postJson(url: string, body: unknown): Promise<CorrectionResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    let payload: CorrectionResponse = {}
    try { payload = (await response.json()) as CorrectionResponse } catch {}
    if (!response.ok) {
      return { error: payload.error || `Request failed (${response.status})` }
    }
    return payload
  } catch (error) {
    if ((error as Error).name === "AbortError") return { error: "Submission timed out. Try again." }
    return { error: "Could not reach the corrections endpoint. Try again, or email karen@paleofoundation.com." }
  } finally {
    clearTimeout(timer)
  }
}

function bind(form: HTMLFormElement) {
  if (form.dataset.hmiCorrectionReady === "true") return
  form.dataset.hmiCorrectionReady = "true"
  const endpoint = form.getAttribute(ENDPOINT_ATTR) || "/api/corrections"

  form.addEventListener("submit", async (event) => {
    event.preventDefault()
    const data = new FormData(form)
    const payload: Record<string, string> = {}
    data.forEach((value, key) => { if (typeof value === "string") payload[key] = value })

    if (!payload.page || !payload.claim || !payload.correction) {
      setStatus(form, "error", "Please fill in the page URL, the disputed claim, and your proposed correction.")
      return
    }

    disable(form, true)
    setStatus(form, "pending", "Submitting...")

    const result = await postJson(endpoint, payload)

    if (result.error) {
      setStatus(form, "error", result.error)
      disable(form, false)
      return
    }

    const ack = result.acknowledgement_target
      ? ` Acknowledgement within ${result.acknowledgement_target}.`
      : ""
    setStatus(
      form,
      "ok",
      (result.message || "Thank you. Your correction has been logged.") + ack,
    )
    form.reset()
  })
}

function setupAll() {
  document
    .querySelectorAll(`form[${ENDPOINT_ATTR}]:not([${READY_ATTR}=true])`)
    .forEach((form) => bind(form as HTMLFormElement))
}

document.addEventListener("nav", setupAll)
queueMicrotask(setupAll)
