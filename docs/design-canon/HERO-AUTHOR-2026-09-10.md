# HMTc hero and author update

Requested September 10: parallel yesterday’s HMI hero and author/sidebar improvements. This updates the older flat hero specification for these components while preserving the HMTc #9f2727 accent, Lora headings, system body font, measured-value typography, and 3px geometry.

The homepage uses a lighter central panel and a darker author panel, with the existing dated program snapshot below it. Interior pages keep their content and original snapshot data, adding the same author card only when frontmatter names Karen. Explicit other authors are retained. The new biography uses the HMI author identity verified September 9, ORCID 0000-0002-2348-7259, and the approved photograph.

DOI records are edition-aware. The current Infant and Child Foods manual has no DOI per data/manuals/manifest.json. Its existing Zenodo DOI 10.5281/zenodo.20771543 is shown only as an earlier, superseded deposited edition. A cited source DOI is never promoted to the DOI of the HMTc page. No identifiers were minted.

This review starts from the published GitHub main (c1d41c2), excluding unpublished standards changes in the separate Desktop checkout. Review publishing uses private Sites access; changing the public domain requires a separate release decision.

Citation metadata uses the same edition-aware DOI lookup as the visible card, preventing citation importers from attaching the superseded identifier to the current edition. Published standards already cite Pendergrass, K.; they receive the same author card even when the generator omits author frontmatter. Institutional and sovereign-reference pages remain unassigned to a person.

The complete default build was run successfully. Its prebuild regenerates unrelated scientific content, so those generated changes were restored. `build:design-review` compiles the exact committed content without re-running the evidence generators, then runs the complete postbuild metadata/PDF pipeline. No standard values or evidence sources change in this review.
