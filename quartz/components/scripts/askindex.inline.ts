type AskCitation = {
  id: number
  title: string
  url: string
  slug: string
  excerpt: string
}

type AskResponse = {
  answer?: string
  confidence?: "high" | "medium" | "low" | "insufficient"
  limits?: string
  citations?: AskCitation[]
  mode?: "model" | "retrieval_only" | "guardrail_fallback"
  error?: string
}

function escapeHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderAnswer(text: string, citations: AskCitation[]) {
  let html = escapeHTML(text)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\[(\d+)\]/g, (_match, id) => {
    const citation = citations.find((item) => item.id === Number(id))
    if (!citation) return `[${id}]`
    return `<a href="${citation.url}" class="ask-index-cite">[${id}]</a>`
  })
  return html
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("")
}

function removeChildren(node: Element) {
  while (node.firstChild) node.removeChild(node.firstChild)
}

function appendMessage(container: Element, role: "user" | "assistant" | "status", html: string) {
  const message = document.createElement("div")
  message.className = `ask-index-message ${role}`
  message.innerHTML = html
  container.appendChild(message)
  container.scrollTop = container.scrollHeight
  return message
}

function renderCitations(citations: AskCitation[]) {
  if (citations.length === 0) return ""

  const items = citations
    .map(
      (citation) => `<li>
        <a href="${citation.url}">[${citation.id}] ${escapeHTML(citation.title)}</a>
        <p>${escapeHTML(citation.excerpt)}</p>
      </li>`,
    )
    .join("")

  return `<div class="ask-index-sources"><div class="ask-index-sources-title">Sources</div><ol>${items}</ol></div>`
}

// Consume a Server-Sent Events stream from /api/ask. Each event block is
// separated by a blank line, with an optional `event: <name>` line and one or
// more `data: ...` lines. The api emits `event: meta` (citations), `event: error`
// (Gateway-level errors like insufficient_funds), and unnamed events whose data
// is an OpenAI-compatible chat completion delta chunk.
async function consumeSSEStream(
  response: Response,
  onEvent: (name: string, payload: unknown) => void,
): Promise<void> {
  if (!response.body) return
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let currentEvent = "message"

  const flush = () => {
    let nlIndex = buffer.indexOf("\n\n")
    while (nlIndex !== -1) {
      const block = buffer.slice(0, nlIndex)
      buffer = buffer.slice(nlIndex + 2)
      const lines = block.split("\n")
      let eventName = currentEvent
      const dataLines: string[] = []
      for (const line of lines) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim()
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart())
      }
      if (dataLines.length === 0) {
        currentEvent = "message"
        nlIndex = buffer.indexOf("\n\n")
        continue
      }
      const dataStr = dataLines.join("\n")
      if (dataStr === "[DONE]") {
        currentEvent = "message"
        nlIndex = buffer.indexOf("\n\n")
        continue
      }
      try {
        const payload = JSON.parse(dataStr)
        onEvent(eventName, payload)
      } catch {
        // Ignore malformed payloads; the stream may yield partial chunks.
      }
      currentEvent = "message"
      nlIndex = buffer.indexOf("\n\n")
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    flush()
  }
  buffer += "\n\n"
  flush()
}

function setupAskIndex(root: Element) {
  const button = root.querySelector(".ask-index-button") as HTMLButtonElement | null
  const panel = root.querySelector(".ask-index-panel") as HTMLDivElement | null
  const dialog = root.querySelector(".ask-index-dialog") as HTMLDivElement | null
  const close = root.querySelector(".ask-index-close") as HTMLButtonElement | null
  const form = root.querySelector(".ask-index-form") as HTMLFormElement | null
  const input = root.querySelector(".ask-index-input") as HTMLTextAreaElement | null
  const messages = root.querySelector(".ask-index-messages") as HTMLDivElement | null
  const suggestions = root.querySelectorAll(".ask-index-suggestions button")

  if (!button || !panel || !dialog || !close || !form || !input || !messages) return

  const openButton = button
  const panelEl = panel
  const closeButton = close
  const formEl = form
  const inputEl = input
  const messagesEl = messages
  let isSubmitting = false

  function openPanel(prefill?: string) {
    panelEl.classList.add("active")
    panelEl.setAttribute("aria-hidden", "false")
    openButton.setAttribute("aria-expanded", "true")
    if (messagesEl.childElementCount === 0) {
      appendMessage(
        messagesEl,
        "assistant",
        "<p>Ask a question and I'll answer only from Heavy Metal Index pages, with citations back to the site.</p>",
      )
    }
    if (prefill) inputEl.value = prefill
    inputEl.focus()
  }

  function closePanel() {
    panelEl.classList.remove("active")
    panelEl.setAttribute("aria-hidden", "true")
    openButton.setAttribute("aria-expanded", "false")
    openButton.focus()
  }

  openButton.addEventListener("click", () => openPanel())
  closeButton.addEventListener("click", closePanel)
  panelEl.addEventListener("click", (event) => {
    if (event.target === panelEl) closePanel()
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panelEl.classList.contains("active")) closePanel()
  })

  suggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => openPanel(suggestion.textContent?.trim() || ""))
  })

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      formEl.requestSubmit()
    }
  })

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const question = inputEl.value.trim()
    if (!question) return

    isSubmitting = true
    appendMessage(messagesEl, "user", `<p>${escapeHTML(question)}</p>`)
    inputEl.value = ""
    const status = appendMessage(messagesEl, "status", "<p>Searching the Index...</p>")

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60_000)
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({
          question,
          pageSlug: document.body.dataset.slug || "",
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      status.remove()

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}) as { error?: string })
        appendMessage(
          messagesEl,
          "assistant",
          `<p>${escapeHTML(errBody.error || `Ask the Index could not answer (status ${response.status}).`)}</p>`,
        )
        return
      }

      const contentType = response.headers.get("content-type") || ""

      // JSON path: the api falls back to JSON for no_evidence_loaded /
      // retrieval_only / guardrail_fallback modes.
      if (contentType.includes("application/json")) {
        const data = (await response.json()) as AskResponse
        if (data.error) {
          appendMessage(messagesEl, "assistant", `<p>${escapeHTML(data.error)}</p>`)
          return
        }
        const citations = data.citations || []
        const limits =
          data.limits && data.confidence !== "high"
            ? `<div class="ask-index-limits">${escapeHTML(data.limits)}</div>`
            : ""
        appendMessage(
          messagesEl,
          "assistant",
          `${renderAnswer(data.answer || "", citations)}${limits}${renderCitations(citations)}`,
        )
        return
      }

      // SSE path: stream chat completion deltas into one assistant message.
      let citations: AskCitation[] = []
      let streamedText = ""
      let errored = false
      const assistantEl = appendMessage(messagesEl, "assistant", "")

      await consumeSSEStream(response, (name, rawPayload) => {
        const payload = rawPayload as {
          citations?: AskCitation[]
          message?: string
          status?: number
          choices?: Array<{ delta?: { content?: string } }>
        }
        if (name === "meta" && Array.isArray(payload.citations)) {
          citations = payload.citations
        } else if (name === "error") {
          errored = true
          const message =
            payload.message || `Ask the Index could not answer (status ${payload.status ?? "?"}).`
          assistantEl.innerHTML = `<p>${escapeHTML(message)}</p>`
        } else if (!errored) {
          const delta = payload.choices?.[0]?.delta?.content
          if (typeof delta === "string" && delta.length > 0) {
            streamedText += delta
            assistantEl.innerHTML = renderAnswer(streamedText, citations)
          }
        }
      })

      if (!errored) {
        assistantEl.innerHTML = renderAnswer(streamedText, citations) + renderCitations(citations)
      }
    } catch (err) {
      status.remove()
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "The request timed out. Try again."
          : "Ask the Index could not connect. Try again in a moment."
      appendMessage(messagesEl, "assistant", `<p>${escapeHTML(message)}</p>`)
    } finally {
      isSubmitting = false
    }
  })
}

function setupAllAskIndex() {
  document.querySelectorAll(".ask-index").forEach((root) => {
    if ((root as HTMLElement).dataset.askIndexReady === "true") return
    ;(root as HTMLElement).dataset.askIndexReady = "true"
    setupAskIndex(root)
  })
}

function setupAskIndexTriggers() {
  document.querySelectorAll("[data-ask-index-trigger]").forEach((trigger) => {
    if ((trigger as HTMLElement).dataset.askIndexTriggerReady === "true") return
    ;(trigger as HTMLElement).dataset.askIndexTriggerReady = "true"
    trigger.addEventListener("click", () => {
      const button = document.querySelector(".ask-index-button") as HTMLButtonElement | null
      button?.click()
    })
  })
}

function setupAskIndexUI() {
  setupAllAskIndex()
  setupAskIndexTriggers()
  setupAllAskPage()
}

document.addEventListener("nav", setupAskIndexUI)

queueMicrotask(setupAskIndexUI)

/* ===========================================================================
 * Page-mode UI (rendered at /ask via wiki/ask.md). The page POSTs to
 * /api/ask and consumes the streaming SSE response per
 * docs/ask-the-index-spec.md. The leading `event: meta` line carries the
 * citation envelope; subsequent `data: {choices:[{delta:{content:"..."}}]}`
 * lines are OpenAI-compatible deltas that we concatenate into the body.
 * ========================================================================= */

type AskPageCitation = {
  id: number
  title: string
  url: string
  slug: string
  excerpt?: string
}

const BASE_URL_HOST = "heavymetalindex.com"

function escapePageHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderInlineLinks(text: string, _citations: AskPageCitation[]) {
  // Escape HTML first so any user-injected angle brackets are inert.
  let html = escapePageHTML(text)
  // Wikilinks: [[slug]] or [[slug|label]] → <a href="/slug">label or slug</a>.
  html = html.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_match, slug: string, label?: string) => {
    const clean = slug.trim()
    const display = (label || clean).trim()
    return `<a href="/${clean}">${escapePageHTML(display)}</a>`
  })
  // Bare URLs to heavymetalindex.com → clickable; strip the host so the link
  // stays site-internal (works in dev and prod).
  const urlRe = /\bhttps?:\/\/(?:www\.)?heavymetalindex\.com(\/[A-Za-z0-9_\-./#?=&%]*)?/g
  html = html.replace(urlRe, (_m, path?: string) => {
    const href = path || "/"
    return `<a href="${href}">${escapePageHTML(href)}</a>`
  })
  // Basic markdown bold (the system prompt may emit some).
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  return html
}

function paragraphize(html: string) {
  // Split on blank lines; preserve single newlines as <br> within paragraphs.
  const paragraphs = html.split(/\n{2,}/).filter((p) => p.trim().length > 0)
  return paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`).join("")
}

function renderCitationItem(citation: AskPageCitation) {
  const safeTitle = escapePageHTML(citation.title || citation.slug)
  const url = citation.url || `/${citation.slug}`
  return `<li><a href="${url}">${safeTitle}</a> <span class="slug">${escapePageHTML(citation.slug)}</span></li>`
}

function dedupeCitations(citations: AskPageCitation[]): AskPageCitation[] {
  const seen = new Set<string>()
  const out: AskPageCitation[] = []
  for (const c of citations) {
    if (!c || !c.slug) continue
    if (seen.has(c.slug)) continue
    seen.add(c.slug)
    out.push(c)
  }
  return out
}

// Construct message nodes directly rather than cloning `<template>` content,
// because Quartz's markdown HTML pass strips children from inline `<template>`
// tags in `wiki/ask.md`. Building via createElement keeps the structure intact
// and avoids depending on raw-HTML template support in markdown.

function appendUserMessage(conv: HTMLElement, text: string) {
  const node = document.createElement("article")
  node.className = "hmi-ask-message hmi-ask-message-user"
  const role = document.createElement("div")
  role.className = "hmi-ask-message-role"
  role.textContent = "You"
  node.appendChild(role)
  const body = document.createElement("div")
  body.className = "hmi-ask-message-body"
  body.innerHTML = paragraphize(escapePageHTML(text))
  node.appendChild(body)
  conv.appendChild(node)
  node.scrollIntoView({ behavior: "smooth", block: "end" })
}

function appendAssistantMessage(conv: HTMLElement) {
  const node = document.createElement("article")
  node.className = "hmi-ask-message hmi-ask-message-assistant"

  const role = document.createElement("div")
  role.className = "hmi-ask-message-role"
  role.textContent = "Index"
  node.appendChild(role)

  const body = document.createElement("div")
  body.className = "hmi-ask-message-body"
  node.appendChild(body)

  const citations = document.createElement("div")
  citations.className = "hmi-ask-message-citations"
  citations.hidden = true
  const citationsTitle = document.createElement("div")
  citationsTitle.className = "hmi-ask-message-citations-title"
  citationsTitle.textContent = "Sources cited"
  citations.appendChild(citationsTitle)
  const citationsList = document.createElement("ol")
  citationsList.className = "hmi-ask-message-citations-list"
  citations.appendChild(citationsList)
  node.appendChild(citations)

  const limits = document.createElement("div")
  limits.className = "hmi-ask-message-limits"
  limits.hidden = true
  node.appendChild(limits)

  const errorBox = document.createElement("div")
  errorBox.className = "hmi-ask-message-error"
  errorBox.hidden = true
  const errorText = document.createElement("span")
  errorText.className = "hmi-ask-message-error-text"
  errorBox.appendChild(errorText)
  const retry = document.createElement("button")
  retry.type = "button"
  retry.className = "hmi-ask-retry"
  retry.textContent = "Retry"
  errorBox.appendChild(retry)
  node.appendChild(errorBox)

  conv.appendChild(node)
  return node
}

function setupAskPage(root: HTMLElement) {
  const endpoint = root.dataset.askEndpoint || "/api/ask"
  const formMaybe = root.querySelector(".hmi-ask-form") as HTMLFormElement | null
  const textareaMaybe = root.querySelector(".hmi-ask-form textarea") as HTMLTextAreaElement | null
  const submitMaybe = root.querySelector(".hmi-ask-submit") as HTMLButtonElement | null
  const convMaybe = root.querySelector(".hmi-ask-conversation") as HTMLElement | null
  const examples = root.querySelectorAll<HTMLButtonElement>("[data-hmi-ask-example]")
  if (!formMaybe || !textareaMaybe || !submitMaybe || !convMaybe) return
  // Re-bind so nested closures inherit the post-guard non-null types.
  const form = formMaybe
  const textarea = textareaMaybe
  const submit = submitMaybe
  const conv = convMaybe

  examples.forEach((btn) => {
    btn.addEventListener("click", () => {
      textarea.value = btn.dataset.hmiAskExample || btn.textContent || ""
      textarea.focus()
    })
  })

  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      form.requestSubmit()
    }
  })

  let inFlight = false

  async function submitQuestion(question: string) {
    if (inFlight) return
    inFlight = true
    submit.disabled = true
    appendUserMessage(conv, question)
    const msg = appendAssistantMessage(conv)
    const body = msg.querySelector(".hmi-ask-message-body") as HTMLElement
    const citationsBox = msg.querySelector(".hmi-ask-message-citations") as HTMLElement
    const citationsList = msg.querySelector(".hmi-ask-message-citations-list") as HTMLElement
    const limitsBox = msg.querySelector(".hmi-ask-message-limits") as HTMLElement
    const errorBox = msg.querySelector(".hmi-ask-message-error") as HTMLElement
    const errorText = msg.querySelector(".hmi-ask-message-error-text") as HTMLElement
    const retryBtn = msg.querySelector(".hmi-ask-retry") as HTMLButtonElement

    body.innerHTML = `<span class="hmi-ask-streaming-cursor"></span>`
    msg.scrollIntoView({ behavior: "smooth", block: "end" })

    let citations: AskPageCitation[] = []
    let streamedText = ""

    const renderFinal = () => {
      body.innerHTML = paragraphize(renderInlineLinks(streamedText.trim(), citations))
      const unique = dedupeCitations(citations)
      if (unique.length > 0) {
        citationsList.innerHTML = unique.map(renderCitationItem).join("")
        citationsBox.hidden = false
      }
    }

    const showError = (message: string) => {
      body.innerHTML = `<p>Ask the Index could not complete the request.</p>`
      errorText.textContent = message
      errorBox.hidden = false
      retryBtn.onclick = () => {
        msg.remove()
        inFlight = false
        submit.disabled = false
        submitQuestion(question)
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60_000)
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream, application/json" },
        body: JSON.stringify({ q: question, pageSlug: document.body.dataset.slug || "" }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const contentType = response.headers.get("content-type") || ""

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        showError(errBody.error || `Request failed with status ${response.status}.`)
        return
      }

      // JSON path: no_evidence_loaded or retrieval_only fallback.
      if (contentType.includes("application/json")) {
        const data = await response.json()
        if (data.mode === "no_evidence_loaded") {
          body.innerHTML = paragraphize(escapePageHTML(
            data.answer ||
              "Heavy Metal Index does not yet carry evidence on that question. Try a question about a specific food, metal, or regulation.",
          ))
          if (data.limits) {
            limitsBox.textContent = data.limits
            limitsBox.hidden = false
          }
          return
        }
        // retrieval_only or other JSON modes: surface answer text + citations.
        citations = data.citations || []
        streamedText = data.answer || ""
        renderFinal()
        if (data.limits) {
          limitsBox.textContent = data.limits
          limitsBox.hidden = false
        }
        return
      }

      // SSE path.
      if (!response.body) {
        showError("The server returned an empty response.")
        return
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let currentEvent = "message"

      const flushEvents = () => {
        // Each event block is separated by a blank line. Each block has zero
        // or one `event: <name>` line and one or more `data: ...` lines.
        let nlIndex = buffer.indexOf("\n\n")
        while (nlIndex !== -1) {
          const block = buffer.slice(0, nlIndex)
          buffer = buffer.slice(nlIndex + 2)
          const lines = block.split("\n")
          let eventName = currentEvent
          const dataLines: string[] = []
          for (const line of lines) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim()
            else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart())
          }
          if (dataLines.length === 0) {
            currentEvent = "message"
            nlIndex = buffer.indexOf("\n\n")
            continue
          }
          const dataStr = dataLines.join("\n")
          if (dataStr === "[DONE]") {
            currentEvent = "message"
            nlIndex = buffer.indexOf("\n\n")
            continue
          }
          try {
            const payload = JSON.parse(dataStr)
            if (eventName === "meta") {
              if (Array.isArray(payload.citations)) citations = payload.citations
            } else if (eventName === "error") {
              showError(payload.message || `Stream error (status ${payload.status ?? "?"}).`)
            } else {
              // Default: OpenAI-compatible chat completion chunk.
              const delta = payload.choices?.[0]?.delta?.content
              if (typeof delta === "string" && delta.length > 0) {
                streamedText += delta
                body.innerHTML =
                  paragraphize(renderInlineLinks(streamedText, citations)) +
                  `<span class="hmi-ask-streaming-cursor"></span>`
              }
            }
          } catch {
            // Ignore malformed payloads.
          }
          currentEvent = "message"
          nlIndex = buffer.indexOf("\n\n")
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        flushEvents()
      }
      // Final flush of any tail content.
      buffer += "\n\n"
      flushEvents()
      renderFinal()
    } catch (err) {
      const message = err instanceof DOMException && err.name === "AbortError"
        ? "The request timed out. Try again."
        : err instanceof Error
          ? err.message
          : "Network error."
      showError(message)
    } finally {
      inFlight = false
      submit.disabled = false
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault()
    const question = textarea.value.trim()
    if (!question) return
    textarea.value = ""
    submitQuestion(question)
  })

  // Deep-link support: /ask?q=<question> prefills the textarea, and /ask?q=...&auto=1
  // additionally submits immediately. Useful for shareable question URLs and for
  // browser screenshot verification.
  try {
    const params = new URLSearchParams(window.location.search)
    const prefill = params.get("q")
    if (prefill) {
      textarea.value = prefill
      if (params.get("auto") === "1") {
        // Submit on the next tick so the page has a chance to paint the prefill first.
        setTimeout(() => form.requestSubmit(), 50)
      }
    }
  } catch {
    // No-op if URL parsing fails.
  }
}

function setupAllAskPage() {
  document.querySelectorAll<HTMLElement>(".hmi-ask-page").forEach((root) => {
    if (root.dataset.hmiAskReady === "true") return
    root.dataset.hmiAskReady = "true"
    setupAskPage(root)
  })
}
