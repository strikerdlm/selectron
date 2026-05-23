#!/bin/bash
# scripts/crossref_walk.sh
# Verifies every DOI in paper/references.bib against the Crossref REST API
# (https://api.crossref.org/works/{DOI}). Writes a TSV verification table
# to exports/{date}_crossref_walk.tsv.
#
# Output columns:
#   citekey  doi  resolves  title  journal  year  first_author
#
# Use: bash scripts/crossref_walk.sh
set -u
OUT="exports/$(date +%F)_crossref_walk.tsv"
mkdir -p exports
printf "citekey\tdoi\tresolves\ttitle\tjournal\tyear\tfirst_author\n" > "$OUT"

# Extract (citekey, doi) pairs from references.bib via awk.
# State machine: when we see "@TYPE{citekey,", remember citekey; when we see
# "doi = {...}", emit (citekey, doi) and reset.
awk '
/^@[a-zA-Z]+\{/ {
  match($0, /\{([^,]+),/, m); citekey=m[1]; doi=""; next
}
/doi\s*=\s*\{/ {
  match($0, /\{([^}]+)\}/, m); doi=m[1];
  if (citekey != "" && doi != "") print citekey "\t" doi
  citekey=""; doi=""
}
' paper/references.bib | while IFS=$'\t' read -r citekey doi; do
  # Hit Crossref REST. 1.5s sleep between requests to be polite.
  resp=$(curl -fsSL --max-time 10 "https://api.crossref.org/works/${doi}" 2>/dev/null || echo "")
  if [ -z "$resp" ]; then
    printf "%s\t%s\tNOT_RESOLVED\t-\t-\t-\t-\n" "$citekey" "$doi" >> "$OUT"
  else
    title=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); t=d.get('message',{}).get('title',['?'])[0] if d.get('message',{}).get('title') else '?'; print(t.replace(chr(9),' ').replace(chr(10),' ')[:80])" 2>/dev/null || echo "?")
    journal=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); j=d.get('message',{}).get('container-title',['?'])[0] if d.get('message',{}).get('container-title') else '?'; print(j[:40])" 2>/dev/null || echo "?")
    year=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('message',{}).get('issued',{}).get('date-parts',[['?']])[0][0]; print(p)" 2>/dev/null || echo "?")
    fauth=$(echo "$resp" | python3 -c "import sys,json; d=json.load(sys.stdin); a=d.get('message',{}).get('author',[{}]); print(a[0].get('family','?') if a else '?')" 2>/dev/null || echo "?")
    printf "%s\t%s\tOK\t%s\t%s\t%s\t%s\n" "$citekey" "$doi" "$title" "$journal" "$year" "$fauth" >> "$OUT"
  fi
  sleep 0.5
done

echo "Wrote $OUT"
echo
echo "Summary:"
awk -F'\t' 'NR>1{c[$3]++} END{for(k in c)print "  "k": "c[k]}' "$OUT"
