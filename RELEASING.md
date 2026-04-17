# Releasing plugins in cerodb-plugins

## Spec-Drive version sync rule

When bumping `spec-drive`, update all of these together:

- `plugins/spec-drive/package.json`
- `plugins/spec-drive/.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json` entry for `spec-drive`

## Important footgun

The Claude `/plugin` UI reads the version shown to users from the root marketplace index.
If `.claude-plugin/marketplace.json` stays stale, users will still see the old version advertised even when the embedded plugin manifests already moved forward.
