import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
// @ts-ignore
import script from "./scripts/askindex.inline"
import style from "./styles/askindex.scss"

const AskIndex: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={classNames(displayClass, "ask-index")}>
      <button type="button" class="ask-index-button" aria-haspopup="dialog" aria-expanded="false">
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
        <span>Ask the Index</span>
      </button>
      <div class="ask-index-panel" aria-hidden="true">
        <div class="ask-index-dialog" role="dialog" aria-modal="true" aria-labelledby="ask-index-title">
          <div class="ask-index-header">
            <div>
              <div id="ask-index-title" class="ask-index-title">
                Ask the Index
              </div>
              <div class="ask-index-subtitle">
                Ask a question about heavy metals in food. Every answer is grounded in cited Heavy Metal Index pages: no outside knowledge, no hallucination. If the corpus doesn't carry evidence on your question, you'll see a "no evidence loaded" reply rather than a guess.
              </div>
            </div>
            <button type="button" class="ask-index-close" aria-label="Close Ask the Index">
              x
            </button>
          </div>
          <div class="ask-index-messages" aria-live="polite"></div>
          <div class="ask-index-suggestions" aria-label="Suggested questions">
            <div class="ask-index-suggestions-label">Try one of these:</div>
            <button type="button">What is the lowest applicable regulatory cap for lead in turmeric, and does the Index show field findings above it?</button>
            <button type="button">Which baby-food categories does FDA Closer to Zero set lead action levels for, and at what ppb?</button>
            <button type="button">What does the literature say about cadmium in cocoa, and which regions report the highest concentrations?</button>
            <button type="button">How does the EU mercury limit for tuna compare to the US FDA action level?</button>
            <button type="button">Is brown rice or white rice higher in inorganic arsenic, and why?</button>
            <button type="button">What testing method should a QA lab use to distinguish total chromium from hexavalent chromium in spices?</button>
          </div>
          <form class="ask-index-form">
            <textarea
              name="question"
              class="ask-index-input"
              rows={3}
              maxlength={800}
              placeholder="Ask about metals, ingredients, products, regulations, or sources..."
              aria-label="Ask a question of the Heavy Metal Index"
            ></textarea>
            <div class="ask-index-actions">
              <span class="ask-index-note">
                Answers are limited to Heavy Metal Index pages.{" "}
                <a href="/ask" class="ask-index-more">More questions →</a>
              </span>
              <button type="submit">Ask</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

AskIndex.afterDOMLoaded = script
AskIndex.css = style

export default (() => AskIndex) satisfies QuartzComponentConstructor
