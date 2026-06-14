# Pandoc build for the Elsevier-style manuscript submission draft
# Usage: make           → build manuscript.docx
#        make all       → build manuscript.docx + cover-letter.docx
#        make clean     → remove generated docx in submission/

PANDOC        := pandoc
MANUSCRIPT    := manuscript.md
BIB           := references.bib
CSL           := elsevier-harvard.csl
REF_DOC       := asr-reference.docx
LUA_FILTER    := figcrossref.lua

SUBMISSION    := submission
OUT_MS        := $(SUBMISSION)/manuscript.docx
OUT_CL        := $(SUBMISSION)/cover-letter.docx

PANDOC_FLAGS  := \
  --from=markdown+tex_math_dollars+raw_tex \
  --to=docx \
  --reference-doc=$(REF_DOC) \
  --bibliography=$(BIB) \
  --csl=$(CSL) \
  --lua-filter=$(LUA_FILTER) \
  --citeproc \
  --resource-path=.

.PHONY: all clean

all: $(OUT_MS) $(OUT_CL)

$(SUBMISSION):
	mkdir -p $@
	mkdir -p $@/figures

$(OUT_MS): $(MANUSCRIPT) $(BIB) $(CSL) $(REF_DOC) $(LUA_FILTER) | $(SUBMISSION)
	$(PANDOC) $(PANDOC_FLAGS) --output=$@ $<
	cp figures/F*.png $(SUBMISSION)/figures/ 2>/dev/null || true
	@echo "Built: $@"

$(OUT_CL): make_cover_letter.cjs | $(SUBMISSION)
	node make_cover_letter.cjs
	@echo "Built: $@"

clean:
	rm -f $(OUT_MS) $(OUT_CL)
	rm -rf $(SUBMISSION)/figures

# Validate reference template
template: asr-reference.docx

asr-reference.docx: make_asr_template.cjs
	node make_asr_template.cjs
