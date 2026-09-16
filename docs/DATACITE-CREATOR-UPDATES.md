# DataCite researcher creators

`data/researcher-identity.json` is the identity source. `data/datacite-creator.json` is its concrete DataCite creator template. The mint adapter validates that the template is current, then preserves explicit creators/coauthors. Only pages without an author declaration use their repository's existing personal or organizational default. Explicit empty author lists fail validation.

Future HMTc deposits derive their publication year from valid `published`, `date`, `briefing_date`, or `effective_date`, in that order; HMI uses `established` or `published`, matching its citation metadata. Modification dates never supply a publication year. Missing dates block minting. HMTc article deposits use `Report` / `Research analysis`. These changes affect future deposits only; the current-record update payload remains creator-only.

The shared implementation lives in `tools/lib/datacite-creators.mjs` and `tools/lib/datacite-creator-updates.mjs`; keep those files identical in HMTc and HMI. A bare ORCID is normalized to its full HTTPS URI and checked with the ORCID checksum. Placeholders are rejected. Organization website URLs are not invented ROR identifiers.

## Prepare and review

These commands do not read DataCite credentials and do not mutate remote records:

```sh
node tools/update-doi-creators.mjs --template
node tools/update-doi-creators.mjs --template --check
node tools/update-doi-creators.mjs --out=reports/datacite/creator-update-plan.json
node --test tools/tests/datacite-creators.test.mjs
```

The plan recursively scans the configured own-DOI frontmatter fields and reads those public records from DataCite. It verifies the repository client ID and prefix in `data/datacite-repository.json`. It also enumerates the public client inventory, saving its complete responses and flagging any owned records absent from local frontmatter for review. It records the existing title, year, version and landing URL for review, and saves complete public JSON snapshots. Public reads cannot establish completeness for private/unlisted drafts. Legacy Zenodo records remain held for their owning repository. A metadata correction does not establish that current web content is the deposited edition.

Review each before/after creator array. Only a matching full Karen Pendergrass name or her ORCID is enriched. Conflicting ORCIDs and duplicate matches stop planning for that record. Coauthor order and metadata remain intact. Karen's affiliations use canonical ICS and Paleo Foundation names in that order, preserve existing registry identifiers, and retain additional affiliations. Other creators and institution-only records are unchanged.

## Apply a reviewed plan

Apply is a separate action. It uses `DATACITE_USER` and `DATACITE_PASSWORD` from the current process; this tool never loads an environment file. The configured repository ID must match the user. The current-record workflow is deliberately restricted to production records already registered or findable.

```sh
node tools/update-doi-creators.mjs --apply --plan=reports/datacite/creator-update-plan.json --backup-dir=/private/local/path/datacite-backups
```

The tool checks every record before writing, then immediately rereads each record. A changed creator digest stops the update. Already-current records are skipped. Full fresh records are backed up to exclusive, mode-0600 files before each PUT. The request contains only `creators`; it contains no event, URL, title, version, DOI attribute, or new-record POST. An absent DOI cannot pass the preceding GET check.

After each PUT, the tool reads the public record and verifies creators and all unrelated bibliographic attributes/relationships, including URL, title, dates, publication year, version, and state. It ignores DataCite's generated XML, update timestamp, metadata revision, and usage/relation counters. Name-only affiliation strings and objects are treated as equivalent in read responses. Failure stops the batch and names the backup; the tool does not roll back automatically. Previously successful records can be skipped on a reviewed retry.

DataCite documents partial PUT updates but also permits PUT to create an absent record. The fresh GET/digest check is an application guard, **not an atomic server-side compare-and-swap**. Avoid concurrent creator edits during application. A record change in the interval between GET and PUT cannot be prevented by this client alone. See [DataCite's update API documentation](https://support.datacite.org/docs/updating-metadata-with-the-rest-api) and [creator schema](https://datacite-metadata-schema.readthedocs.io/en/4.7/properties/creator/).

## HMI adapter

HMI synthesis and metal pages retain the personal default; ingredients, products, and regulations retain the institutional default. Explicit authors override those defaults. Third-party source pages are excluded even when `--include-sources` or `--priority=6` is supplied. The former flag fails explicitly. `node tools/datacite-preflight.mjs --preview` prints the creator template offline without reading credentials; the existing connection preflight without that flag performs remote operations and is a separate workflow.

## Prepared inventory (2026-09-16)

HMTc: `reports/datacite/hmtc-creator-update-plan.json` contains four creator updates and one held Zenodo DOI. HMI: `reports/datacite/hmi-creator-update-plan.json` contains 26 creator updates. Public client inventories returned exactly four HMTc and 26 HMI findable records; all map to these plans, with no unmapped public records. No plan has been applied. Existing HMI mint dry-run reports 27 basename suffix collisions; these are unrelated to creator updates and still block ordinary live minting.
