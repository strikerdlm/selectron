-- figcrossref.lua: resolves [@fig:xxx] cross-references in pandoc
-- Maps figure IDs to numbers in order of first appearance

local fig_map = {}   -- id → number
local fig_counter = 0

-- First pass: collect figure IDs in document order
function collect_figures(el)
  local id = el.identifier
  if id and id ~= "" and id:match("^fig:") then
    if not fig_map[id] then
      fig_counter = fig_counter + 1
      fig_map[id] = fig_counter
    end
  end
  return el
end

-- Second pass: replace Cite elements that are fig: references
function replace_fig_cite(el)
  if #el.citations == 1 then
    local key = el.citations[1].id
    if key:match("^fig:") then
      local num = fig_map[key]
      local label = num and ("Fig. " .. num) or ("[" .. key .. "]")
      return pandoc.Str(label)
    end
  end
  return el
end

-- Run two passes
function Pandoc(doc)
  -- pass 1: walk images to build the map
  doc:walk({ Image = collect_figures })
  -- pass 2: replace Cite nodes
  return doc:walk({ Cite = replace_fig_cite })
end
