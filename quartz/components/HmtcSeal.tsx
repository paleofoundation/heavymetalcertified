import { HMTC_SEAL_ALT, HMTC_SEAL_SRC } from "../util/hmtcSeal"

// Visible <img> (not a CSS background) so Google Images can associate the seal
// PNG with the page. Intrinsic size is the 1200px asset; CSS scales the stamp.
export function HmtcSeal() {
  return (
    <img
      class="hmtc-seal"
      src={HMTC_SEAL_SRC}
      alt={HMTC_SEAL_ALT}
      width={1200}
      height={1200}
    />
  )
}
