#!/usr/bin/env bash
#
# sync-case.sh -- publish a case site produced by a litecrew-workspace run
#                 under ./cases/<slug>/ on the landing site.
#
# Usage:
#   scripts/sync-case.sh <src-path> <slug>
#
#   <src-path>  directory containing the static case site (read-only; the
#               source repository is never modified)
#   <slug>      case identifier, lowercase letters / digits / dashes only;
#               the case becomes live at https://litecrew.ai/cases/<slug>/
#
# What it does (idempotent -- rerunning produces byte-identical output):
#   1. mirror the source tree into cases/<slug>/ (destination is rebuilt
#      from scratch, which gives rsync --delete semantics with no rsync)
#   2. inject the litecrew provenance bar right after <body> in every HTML
#      file (self-contained inline styles; the case's own stylesheet is
#      never touched; an existing bar is replaced, not duplicated)
#   3. rewrite placeholder feed URLs (example.org) to the live case URL
#
# Dependencies: bash, git (only to resolve the source-repository URL for
# the provenance bar link), awk, sed, find, cp. No rsync, no Node, no Python.

set -euo pipefail

SITE_ORIGIN="https://litecrew.ai"

usage() {
  echo "usage: scripts/sync-case.sh <src-path> <slug>" >&2
  exit 2
}

[ $# -eq 2 ] || usage

SRC=$1
SLUG=$2

if [ ! -d "$SRC" ]; then
  echo "sync-case.sh: source directory not found: $SRC" >&2
  exit 1
fi

case "$SLUG" in
  '' | *[!a-z0-9-]*)
    echo "sync-case.sh: slug must be lowercase letters, digits, or dashes: $SLUG" >&2
    exit 1
    ;;
esac

# Resolve the script's repository root (the destination lives there).
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

DEST="$REPO_ROOT/cases/$SLUG"
CASE_URL="$SITE_ORIGIN/cases/$SLUG/"

# --------------------------------------------------------------------------
# Resolve the source repository's GitHub tree URL for the provenance bar.
# Handles https and ssh remotes, including ssh-host aliases
# (git@github.com-alias:owner/repo.git).
# --------------------------------------------------------------------------
source_url=""
if repo_root=$(git -C "$SRC" rev-parse --show-toplevel 2>/dev/null); then
  branch=$(git -C "$SRC" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  remote=$(git -C "$SRC" remote get-url origin 2>/dev/null || echo "")
  https_base=""
  case "$remote" in
    git@*)
      repo_part=${remote#*:}          # strips git@host: (also ssh aliases)
      repo_part=${repo_part%.git}
      https_base="https://github.com/$repo_part"
      ;;
    https://github.com/*)
      https_base=${remote%.git}
      ;;
  esac
  if [ -n "$https_base" ] && [ -n "$branch" ]; then
    rel=${SRC#"$repo_root"/}
    if [ "$rel" != "$SRC" ] && [ -n "$rel" ]; then
      source_url="$https_base/tree/$branch/$rel"
    else
      source_url="$https_base/tree/$branch"
    fi
  fi
fi

# --------------------------------------------------------------------------
# The provenance bar. Everything is scoped under #lc-provenance-bar so the
# case's own stylesheet and design are never affected, and vice versa.
# --------------------------------------------------------------------------
source_link_open=""
source_link_close=""
source_sep=""
if [ -n "$source_url" ]; then
  source_link_open="<a href=\"$source_url\" target=\"_blank\" rel=\"noopener\">"
  source_link_close="</a>"
  source_sep=" &middot; "
fi

read -r -d '' BAR <<HTML || true
<!--lc-provenance-bar:start-->
<aside id="lc-provenance-bar" aria-label="How this site was made">
<style>
#lc-provenance-bar{background:#0b0c0f;color:#b9b7ae;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-size:12.5px;line-height:1.5;border-bottom:1px solid #2a2d33}
#lc-provenance-bar .lc-bar__inner{max-width:1080px;margin:0 auto;padding:10px 20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 16px;text-align:center}
#lc-provenance-bar p{margin:0}
#lc-provenance-bar .lc-bar__mark{color:#d4a05a;font-weight:600;letter-spacing:.02em;margin-right:.45em}
#lc-provenance-bar a{color:#d4a05a;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.18em}
#lc-provenance-bar a:hover{color:#e5b877}
#lc-provenance-bar a:focus-visible{outline:2px solid #d4a05a;outline-offset:2px}
@media (max-width:480px){#lc-provenance-bar .lc-bar__inner{padding:10px 14px}}
</style>
<div class="lc-bar__inner">
<p><span class="lc-bar__mark">litecrew</span>This site was produced entirely by a litecrew-workspace run.</p>
<p><a href="/">Back to litecrew.ai</a>$source_sep$source_link_open Source run on GitHub$source_link_close</p>
</div>
</aside>
<!--lc-provenance-bar:end-->
HTML

# --------------------------------------------------------------------------
# 1. Mirror the source tree. Rebuilding the destination from scratch gives
#    rsync --delete semantics: files removed upstream disappear here too.
# --------------------------------------------------------------------------
rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$SRC"/. "$DEST"/

# --------------------------------------------------------------------------
# 2. Inject the provenance bar into every HTML file (idempotent: any existing
#    bar block is removed first, then the fresh bar is inserted after <body>).
# --------------------------------------------------------------------------
injected=0
while IFS= read -r -d '' f; do
  LC_BAR=$BAR awk '
    /<!--lc-provenance-bar:start-->/ { inbar = 1 }
    /<!--lc-provenance-bar:end-->/   { inbar = 0; next }
    inbar                            { next }
    { print }
    !done && /<body[ \t>]/ { print ENVIRON["LC_BAR"]; done = 1 }
    END { if (!done) { print "sync-case.sh: no <body> tag in " FILENAME > "/dev/stderr"; exit 3 } }
  ' "$f" > "$f.lcsync" && mv "$f.lcsync" "$f"
  injected=$((injected + 1))
done < <(find "$DEST" -type f -name '*.html' -print0)

# --------------------------------------------------------------------------
# 3. Rewrite placeholder feed/asset URLs to the live case URL.
#    The specific legacy prefix goes first; any residual example.org host is
#    then mapped host-for-host so nothing is left behind.
# --------------------------------------------------------------------------
rewritten=0
while IFS= read -r -d '' f; do
  before=$(grep -c 'example\.org' "$f" || true)
  if [ "$before" -gt 0 ]; then
    sed -i "s|https://example\.org/dead-web-gazette/|$CASE_URL|g" "$f"
    sed -i "s|https://example\.org/|${SITE_ORIGIN}/cases/$SLUG/|g" "$f"
    rewritten=$((rewritten + 1))
  fi
done < <(find "$DEST" -type f \( -name '*.xml' -o -name '*.html' \) -print0)

residual=$(find "$DEST" -type f \( -name '*.xml' -o -name '*.html' \) -exec grep -l 'example\.org' {} + || true)
if [ -n "$residual" ]; then
  echo "sync-case.sh: example.org still present after rewrite:" >&2
  echo "$residual" >&2
  exit 4
fi

echo "sync-case.sh: synced cases/$SLUG/"
echo "  files mirrored : $(find "$DEST" -type f | wc -l)"
echo "  bar injected   : $injected html pages"
echo "  urls rewritten : $rewritten files"
echo "  live at        : $CASE_URL"
