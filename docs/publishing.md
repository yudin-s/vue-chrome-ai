# npm Publishing Preparation

This document captures the publication choices for `@yudin-s/vue-chrome-ai`.

## Package Positioning

- Vue 3 composables and plugin for Chrome's browser-side `LanguageModel` API.
- Browser-native runtime, no API keys, and no bundled model.
- Lifecycle control: readiness, download progress, session ownership, streaming, and teardown.
- Complementary to AI SDK provider packages rather than a replacement for them.

Good npm search terms are included in `package.json`: `vue`, `vue3`, `vue-plugin`, `vue-composables`, `chrome-ai`, `built-in-ai`, `gemini-nano`, `prompt-api`, `language-model`, `on-device-ai`, `summarizer`, and `translator`.

## Best Practices Applied

- ESM and CJS builds are both published.
- Type declarations are generated and exported.
- `exports` is explicit to avoid accidental deep imports.
- `sideEffects: false` enables tree-shaking.
- Vue is a peer dependency.
- Package contents are controlled with `files`.
- Docs, recipes, agent guidance, and copy-paste Vue SFC examples are included.
- `publishConfig.access` is `public` for the scoped package.
- `publishConfig.provenance` is enabled.
- CI runs typecheck, tests, build, audit, and dry-pack.
- `prepublishOnly` runs typecheck, tests, build, audit, and dry-pack.

## Pre-Publish Checklist

Run:

```bash
npm install
npm run publish:check
npm --cache ./.npm-cache pack --dry-run --json
```

Optional compatibility checks before the first public release:

```bash
npx publint
npx @arethetypeswrong/cli --pack .
```

These checks require temporary network downloads unless added as dev dependencies.

## Publishing Options

### Recommended: Trusted Publishing From GitHub Actions

Use npm trusted publishing when the GitHub repository is public and configured as a trusted publisher in npm.

Benefits:

- no long-lived npm token in GitHub secrets;
- npm publishes provenance attestations automatically;
- safer release audit trail.

Suggested flow:

1. Create the GitHub repository matching `package.json`.
2. Publish the first package version manually if the package does not exist yet.
3. Configure npm trusted publishing for the package and release workflow.
4. Tag a release, for example `v0.1.0`.
5. Let GitHub Actions publish to npmjs.com and GitHub Packages.

Trusted publishing requires npm CLI `11.5.1` or later and Node `22.14.0` or later. The publish workflow uses Node `24`.

Configure npm trusted publishing with:

- Provider: GitHub Actions
- Organization or user: `yudin-s`
- Repository: `vue-chrome-ai`
- Workflow filename: `publish.yml`
- Environment: leave empty unless a GitHub deployment environment is added later

When published through trusted publishing from this public GitHub repository, npm automatically generates provenance attestations. The workflow does not need `--provenance`.

The same workflow also publishes the package to GitHub Packages using `GITHUB_TOKEN` and the `packages: write` permission. The GitHub Packages step sets `NPM_CONFIG_PROVENANCE=false` because GitHub Packages is authenticated with `GITHUB_TOKEN`, while npmjs.com provenance is handled by trusted publishing.

### Manual First Publish

```bash
npm login
npm publish --access public --provenance
```

Use npm 2FA for publish/settings changes.

## Suggested First Release

Title:

```text
v0.1.0 - Vue composables for Chrome LanguageModel
```

Summary:

```text
Initial release with Vue 3 composables and plugin support for Chrome's browser-side LanguageModel API. Includes availability checks, download progress, session lifecycle, prompt and streaming helpers, structured output, reflection, context tracking, and wrappers for Summarizer, Translator, Language Detector, Writer, Rewriter, and Proofreader.
```
