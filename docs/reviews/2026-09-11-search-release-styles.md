# Search styling lost across releases

The user's existing Chrome tab reproduced the screenshot: new homepage search
markup with persisted stylesheet `index.6334cdd9ce.css`. Current live HTML linked
`index.9426c45d2c.css`. The field computed to `display:block`, height 27.4px;
the input used the browser's 13.33px default. Reloading the same tab restored the
intended flex field, 58px tall. No search styling changes were necessary.

`Head.tsx` marks the global stylesheet persistent. The SPA router retained it and
the running scripts while morphing new-release HTML into the old document.
Hashed filenames protected fresh document loads, but not an already-open tab.
An independent older-stylesheet reproduction confirmed that SPA navigation made
no request for the new stylesheet. Fresh-page checks had missed this case.

The router now compares the destination's persistent stylesheet URLs before
`prenav`, cleanup or body morphing. A mismatch loads the destination as a full
document, keeping markup, CSS and scripts together. History navigation reloads
the current entry instead of adding another. Same-release navigation stays SPA.
Nonpersistent font sheets are excluded. Current stylesheet URLs come from
`link.sheet.href`, which retains the loaded URL after pushState changes the
document base. Incoming relative links resolve against the destination URL.

Existing tabs running the older router need one document reload to receive this
fix. The user's affected Chrome tab is refreshed at handoff.

Validation:

- Direct Quartz build and TypeScript: exit 0.
- Design-lint: exit 0, with the existing table-canonicalization advisory.
- `check:v3`: exit 0, 315 rendered assertions.
- `check:spa-release`: a simulated publishing server changes stylesheet filenames
  and script markers while a tab stays open. It checks fresh-home/nested-page
  same-release navigation, document/CSS/script replacement after a release,
  same-document Back/Forward crossing a release, and preserved history entries.
- The actual live Chrome tab was inspected before and after reload. Search layout,
  content, author details and the Big 8 source panels are preserved.
