// The five one-page cheat tables, rebuilt from the quick-reference images as HTML/CSS.
// Corrections vs the images: Domain 4 is "Prompt Engineering & Structured Output" (image said
// "Build Effective Agents"), Domain 5 weighs 15% (image said 18%), and tool_choice "none" is added.
// The images' "exam trigger → what to choose" tables are deliberately left out.
import { md, esc, icon } from "./lib.mjs";

const C = { blue: "var(--d1)", teal: "var(--d2)", amber: "var(--d3)", rose: "var(--d4)", violet: "var(--d5)", green: "var(--success)", red: "var(--danger)" };
const col = (c) => C[c] || c;

// A card is a bordered box; its number takes the sheet's domain colour (set on the grid).
const card = ({ n, title, sub, w = 4 }, ...kids) =>
  `<section class="Box cs-card${w === 4 ? "" : " w" + w}">
  <header class="cs-h"><span class="n">${n ? esc(n) : ""}</span><h2>${md(title)}</h2>${sub ? `<p>${md(sub)}</p>` : ""}</header>
  <div class="cs-body">${kids.join("\n")}</div>
</section>`;

const list = (cls, items) => `<ul class="${cls}">${items.map((i) => `<li>${md(i)}</li>`).join("")}</ul>`;
const ok = (title, items) => `<div class="pnl ok"><h4>${icon("circleCheck")}${md(title)}</h4>${list("ticks", items)}</div>`;
const no = (title, items) => `<div class="pnl no"><h4>${icon("circleX")}${md(title)}</h4>${list("crosses", items)}</div>`;
const tip = (title, html) => `<div class="pnl tip"><h4>${icon("bulb")}${md(title)}</h4>${html}</div>`;
const pnl = (title, html, ic) => `<div class="pnl acc">${title ? `<h4>${ic ? icon(ic) : ""}${md(title)}</h4>` : ""}${html}</div>`;
const bul = (items) => list("bul", items);
const p = (s) => `<p>${md(s)}</p>`;
const stack = (...xs) => `<div class="cs-stack">${xs.join("")}</div>`;
const cols = (...xs) => `<div class="cs-cols">${xs.map((x) => `<div class="cs-stack">${x}</div>`).join("")}</div>`;
const steps = (items) =>
  `<ol class="steps">${items.map((i) => (Array.isArray(i) ? `<li><div><b>${md(i[0])}</b><span>${md(i[1])}</span></div></li>` : `<li><div>${md(i)}</div></li>`)).join("")}</ol>`;
const nlist = (items, t) => `<ol class="nlist"${t ? ` style="--t:${col(t)}"` : ""}>${items.map((i) => `<li><div>${md(i)}</div></li>`).join("")}</ol>`;
const code = (html) => `<pre class="cb"><code>${html}</code></pre>`;
const kv = (rows, wide) =>
  `<div class="kv${wide ? " wide" : ""}">${rows
    .map((r) => `<div><span class="tag"${r.t ? ` style="--t:${col(r.t)}"` : ""}>${md(r.tag).replace(/\n/g, "<br>")}</span>${bul(r.items)}</div>`)
    .join("")}</div>`;
const node = (n) => `<div class="node"${n.t ? ` style="--t:${col(n.t)}"` : ""}${n.bad ? "" : ""}><b>${md(n.b)}</b>${n.s ? `<span>${md(n.s)}</span>` : ""}</div>`;
const flow = (nodes) => `<div class="flow">${nodes.map(node).join('<span class="to" aria-hidden="true">→</span>')}</div>`;
const vflow = (nodes) =>
  `<div class="vflow">${nodes
    .map((n) => `<div class="node${n.bad ? " bad" : ""}"${n.t ? ` style="--t:${col(n.t)}"` : ""}><b>${md(n.b)}</b>${n.s ? `<span>${md(n.s)}</span>` : ""}</div>`)
    .join('<span class="to" aria-hidden="true">↓</span>')}</div>`;
const mtable = (head, rows) =>
  `<div class="cs-scroll"><table class="mtable"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => (i === 0 && typeof c === "object" ? `<td class="tool" style="--t:${col(c.t)}">${esc(c.v)}</td>` : `<td>${md(c)}</td>`)).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
const tiles = (items) =>
  `<div class="tiles">${items.map((t) => `<div class="tile"${t.t ? ` style="--t:${col(t.t)}"` : ""}>${icon(t.ic)}<div><b>${md(t.b)}</b><span>${md(t.s)}</span></div></div>`).join("")}</div>`;
const dd = (dos, donts) => `<div class="dd">${ok("Do", dos)}${no("Don't", donts)}</div>`;
const hub = () => `<div class="hub">
  <div class="core"><b>Coordinator agent</b>Decomposition · Delegation · Aggregation<br>Error handling · Inter-agent communication</div>
  <svg class="wires" viewBox="0 0 200 22" preserveAspectRatio="none" aria-hidden="true"><path d="M100 0v22M100 0 15 22M100 0l85 22" stroke="currentColor" stroke-width="1.5" fill="none" vector-effect="non-scaling-stroke"/></svg>
  <div class="spokes"><div>Subagent A</div><div>Subagent B</div><div>Subagent C</div></div>
</div>`;

/* ======================================================================= */
const d1 = [
  card(
    { n: "1.1", title: "Agentic loops for autonomous task execution", ic: "loop", c: "blue", w: 6 },
    cols(
      pnl("How the loop works", steps([
        "Send the request to Claude (tools + messages).",
        "Inspect `stop_reason`.",
        'If `stop_reason` is `"tool_use"`, execute the requested tool.',
        "Append the `tool_use` and `tool_result` blocks to the history.",
        "Continue the loop for the next iteration.",
        'If `stop_reason` is `"end_turn"`, terminate the loop.',
      ]), "list"),
      ok("Key points", [
        "The model decides the next action based on context.",
        "Tool results are added to the conversation so Claude can reason about the next step.",
        "Use decision trees or tool sequences only when needed.",
      ]) +
        no("Avoid", [
          "Parsing natural language completion signals.",
          "Arbitrary iteration caps as the primary stopping mechanism.",
          "Relying on assistant text to decide completion.",
        ])
    )
  ),
  card(
    { n: "1.2", title: "Multi-agent systems with coordinator–subagent patterns", ic: "network", c: "amber", w: 6 },
    cols(
      pnl("Architecture (hub-and-spoke)", hub(), "network") +
        tip("Subagent context", p("Subagents have **isolated** context and do NOT inherit the coordinator's conversation history.".replace(/\*\*/g, ""))),
      ok("Key points", [
        "The coordinator manages all communication, routing and result aggregation.",
        "Select subagents dynamically based on query complexity.",
        "Partition scope to reduce duplication.",
        "Iterate and re-delegate to close coverage gaps.",
      ]) + no("Avoid", ["Overly narrow decomposition that misses broader research topics."])
    )
  ),
  card(
    { n: "1.3", title: "Subagent invocation, context passing & spawning", ic: "filePlus", c: "green", w: 6 },
    cols(
      ok("Key points", [
        "Spawn subagents with the `Task` tool (current SDKs emit it as `Agent`; match both names).",
        "The coordinator's `allowedTools` MUST include the spawn tool, or no subagent can be called.",
        "Subagents do NOT inherit parent context automatically.",
        "Explicitly pass all relevant context (findings, source URLs, document names, page numbers) in the prompt.",
        "Configure an `AgentDefinition` (description, system prompt, tool restrictions).",
        "Spawn parallel subagents with multiple `Task` calls in one response.",
        "Use `fork_session` to explore divergent approaches from a shared baseline.",
      ]),
      pnl("Example context to pass", bul(["Findings from prior agents", "Web search results (URLs)", "Document names", "Page numbers", "Relevant analysis outputs"]), "doc") +
        no("Avoid", ["Assuming subagents can access parent context.", "Omitting context needed for accurate analysis."])
    )
  ),
  card(
    { n: "1.4", title: "Multi-step workflows with enforcement & handoff", ic: "gate", c: "rose", w: 6 },
    cols(
      ok("Key points", [
        "Use programmatic enforcement (hooks, prerequisite gates) for deterministic compliance.",
        "Prompt guidance alone is probabilistic and has a non-zero failure rate.",
        "Block downstream tool calls until prerequisites succeed (e.g. `process_refund` requires a verified customer ID).",
        "Decompose multi-concern requests and investigate in parallel using shared context.",
        "Provide a structured handoff when escalating to humans.",
      ]),
      pnl("Prerequisite gate", vflow([{ b: "Verify customer ID", t: "green" }, { b: "Process refund", t: "blue" }, { b: "Blocked until prerequisite succeeds", bad: true }]), "gate") +
        pnl("Structured handoff includes", bul(["Customer ID", "Root-cause analysis", "Refund amount", "Recommended action", "Conversation transcript (as needed)"]), "doc")
    )
  ),
  card(
    { n: "1.5", title: "Agent SDK hooks for tool-call interception & data normalisation", ic: "hook", c: "violet", w: 6 },
    cols(
      ok("Key points", [
        "`PostToolUse` hook: intercept and transform tool results before the model processes them.",
        "Pre-call hooks (`PreToolUse`): enforce compliance rules, e.g. block refunds above a threshold.",
        "Use hooks when business rules require guaranteed compliance.",
      ]),
      pnl("Examples", kv([
        { tag: "PostToolUse", t: "violet", items: ["Normalise data, format timestamps, convert to a structured format"] },
        { tag: "PreToolUse", t: "rose", items: ["Block policy-violating actions, redirect to an alternative workflow"] },
      ]), "hook")
    )
  ),
  card(
    { n: "1.6", title: "Task decomposition strategies for complex workflows", ic: "target", c: "rose", w: 6 },
    cols(
      ok("Key points", [
        "Fixed sequential pipelines (prompt chaining) for predictable multi-step reviews.",
        "Dynamic / adaptive decomposition for open-ended investigations driven by intermediate findings.",
        "Large code reviews: per-file local passes + a separate cross-file integration pass.",
        "Avoid attention dilution across too many files.",
        "The coordinator maps structure, finds high-impact areas and adapts the plan as dependencies emerge.",
      ]),
      pnl("Decomposition patterns", vflow([{ b: "Sequential", s: "prompt chaining", t: "blue" }, { b: "Dynamic / adaptive", s: "based on findings", t: "green" }]).replace(/<span class="to"[^>]*>↓<\/span>/, ""), "route") +
        no("Avoid", ["Large reviews without separating per-file analysis and cross-file integration."])
    )
  ),
  card(
    { n: "1.7", title: "Session state, resumption and forking", ic: "database", c: "blue", w: 12 },
    `<div class="cs-cols" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))">
      ${ok("Key points", [
        "Use `--resume <session-name>` to continue a named session when prior context is still valid.",
        "Use `fork_session` to create independent branches from a shared analysis baseline.",
        "When resuming, tell the agent which files changed and ask for targeted re-analysis.",
        "If prior tool results are stale, start a new session with a structured summary.",
      ])}
      ${pnl("When to use what", kv([
        { tag: "Resume", t: "green", items: ["Prior context is mostly valid", "Continue a specific investigation", "`--resume <session-name>`"] },
        { tag: "Fork", t: "blue", items: ["Explore divergent approaches", "Compare strategies in parallel", "`fork_session` / `--fork-session`"] },
      ]), "branch")}
      ${pnl("Start fresh", bul(["When prior tool results are stale", "Seed with a structured summary of previous findings", "More reliable than resuming with outdated context"]), "loop")}
    </div>`
  ),
];

/* ======================================================================= */
const d2 = [
  card(
    { n: "2.1", title: "Design effective tool interfaces", sub: "Clear descriptions, boundaries and examples.", ic: "doc", c: "rose" },
    ok("Key points", [
      "Write clear, distinct tool names and descriptions.",
      "Include purpose, expected inputs (with format), outputs and example queries.",
      "Add edge cases and boundaries: when to use this tool vs the alternatives.",
      "Vague or overlapping descriptions cause misrouting between similar tools.",
      'System prompt wording can create unintended keyword associations (e.g. "analyze" in several tools).',
      "Split generic tools into purpose-specific ones (e.g. `extract_data_points` vs `summarize_content`).",
    ]),
    no("Avoid", ["Minimal or ambiguous descriptions.", "Overlapping tools with similar names or purposes.", "Missing input/output details or examples."])
  ),
  card(
    { n: "2.2", title: "Structured MCP errors", sub: "Clear, actionable error responses.", ic: "alert", c: "blue" },
    ok("Key points", [
      "Use the MCP `isError` flag with structured metadata.",
      "Include `errorCategory`, `isRetryable` and a human-readable message.",
      "Keep a successful empty result distinct from a failure.",
      "Recover locally in subagents for transient errors; propagate unresolved failures to the coordinator with partial results and context.",
    ]),
    pnl("Error response format", code(`{
  <span class="k">"isError"</span>: <span class="s">true</span>,
  <span class="k">"errorCategory"</span>: <span class="s">"transient | validation | business | permission"</span>,
  <span class="k">"isRetryable"</span>: <span class="s">boolean</span>,
  <span class="k">"message"</span>: <span class="s">"Human-readable explanation"</span>
}`), "braces"),
    pnl("Error categories & handling", kv([
      { tag: "Transient", t: "blue", items: ["Timeout / service unavailable", "Usually retryable"] },
      { tag: "Validation", t: "amber", items: ["Invalid input or parameters", "Needs input correction; not retryable as-is"] },
      { tag: "Business", t: "rose", items: ["Policy / business-rule violation (e.g. refund above threshold)", "Usually not retryable"] },
      { tag: "Permission", t: "violet", items: ["Access denied / missing permissions", "Needs access resolution or escalation"] },
    ]), "list")
  ),
  card(
    { n: "2.3", title: "Tool allocation & `tool_choice`", sub: "Give the right tools to the right agents.", ic: "target", c: "green" },
    ok("Key points", [
      "Too many tools (e.g. 18 instead of 4–5) degrades tool-selection reliability.",
      "Give each agent scoped, least-privilege tools relevant to its role.",
      "Keep cross-role tools limited to high-frequency needs.",
      "Route complex cases through the coordinator.",
    ]),
    pnl("`tool_choice` options", kv([
      { tag: "auto", t: "blue", items: ["Default", "Model may answer with text or call a tool"] },
      { tag: "any", t: "amber", items: ["Must call a tool", "Model chooses which tool"] },
      { tag: "forced", t: "rose", items: ["Must call the named tool", '`{"type":"tool","name":"…"}`'] },
      { tag: "none", t: "violet", items: ["Tools stay defined but cannot be called"] },
    ]), "gear"),
    no("Avoid", ["Giving agents access to many unrelated tools.", "Generic tools instead of constrained alternatives.", "Cross-specialisation access (agents using tools outside their role)."])
  ),
  card(
    { n: "2.4", title: "Integrate MCP servers", sub: "Configure and use MCP servers effectively.", ic: "database", c: "violet", w: 6 },
    ok("Key points", [
      "Use project-level `.mcp.json` for shared team servers.",
      "Use user-level `~/.claude.json` for personal / experimental servers.",
      "Use environment variables (e.g. `${GITHUB_TOKEN}`) for credentials; never commit secrets.",
      "Tools from configured MCP servers are discovered at connection time and available together.",
      "Use MCP resources to expose content catalogues (issue summaries, docs hierarchy, DB schemas) and cut exploratory tool calls.",
      "Prefer established community servers for standard integrations (e.g. Jira); build custom servers for team-specific workflows.",
      "Improve tool descriptions to explain capabilities and outputs.",
      "For local code search, built-in Grep can beat an MCP server.",
    ]),
    pnl("Configuration files", `<div class="cs-cols">
      <div class="tile" style="--t:var(--d1)">${icon("folder")}<div><b>Project-level (shared)</b><span><code>.mcp.json</code> · team-wide servers, checked into the repo</span></div></div>
      <div class="tile" style="--t:var(--d5)">${icon("user")}<div><b>User-level (personal)</b><span><code>~/.claude.json</code> · personal / experimental servers, not shared</span></div></div>
    </div>`, "gear")
  ),
  card(
    { n: "2.5", title: "Built-in tools: Read, Write, Edit, Bash, Grep, Glob", sub: "The right tool for file operations and code exploration.", ic: "wrench", c: "amber", w: 6 },
    mtable(["Tool", "Purpose", "Key points"], [
      [{ v: "Grep", t: "rose" }, "Search file contents", "Find patterns (function names, error messages, imports). Best for code content."],
      [{ v: "Glob", t: "violet" }, "Find file paths / names", 'Match names or extensions (e.g. `**/*.test.tsx`). Best for locating files.'],
      [{ v: "Read", t: "blue" }, "Read file contents", "Read full content after finding the relevant files."],
      [{ v: "Write", t: "green" }, "Create / overwrite file", "New file, or overwrite full file content."],
      [{ v: "Edit", t: "amber" }, "Targeted modification", "Edit using unique text matching. If the anchor isn't unique, fall back to Read + Write."],
      [{ v: "Bash", t: "red" }, "Run shell commands", "Execute build, test and scripts."],
    ]),
    pnl("Codebase exploration workflow", flow([
      { b: "1 · Grep", s: "Find entry points (function names…)", t: "rose" },
      { b: "2 · Read", s: "Relevant files only, don't read everything", t: "blue" },
      { b: "3 · Trace", s: "Follow imports / callers to understand flow", t: "violet" },
    ]), "route")
  ),
  card(
    { title: "Remember", w: 12 },
    tiles([
      { ic: "doc", t: "rose", b: "Tool descriptions guide selection", s: "Clear, distinct descriptions prevent misrouting." },
      { ic: "alert", t: "blue", b: "Structured errors guide recovery", s: "Use `errorCategory`, `isRetryable` and clear messages." },
      { ic: "shield", t: "amber", b: "Least privilege for each agent", s: "Give scoped tools relevant to the agent's role." },
      { ic: "database", t: "violet", b: "Empty result ≠ failure", s: "A valid empty result means no matches. That's different from an error." },
    ])
  ),
];

/* ======================================================================= */
const d3 = [
  card(
    { n: "3.1", title: "CLAUDE.md hierarchy, scoping & modular organisation", sub: "Organise instructions with the right scope and structure.", ic: "doc", c: "blue", w: 6 },
    pnl("Hierarchy & scope", kv([
      { tag: "User-level\n`~/.claude/CLAUDE.md`", t: "rose", items: ["Personal instructions", "Not shared with the team", "Applies to all your projects"] },
      { tag: "Project-level\n`CLAUDE.md` or `.claude/CLAUDE.md`", t: "amber", items: ["Shared via version control", "Project-specific context", "Team standards"] },
      { tag: "Directory-level\n`CLAUDE.md`", t: "green", items: ["Applies to a subdirectory", "Adds detail for specific modules", "Useful for packages / modules"] },
    ], true), "folder"),
    cols(
      pnl("Modular organisation", bul(["Use `@import` (e.g. `@path/to/standards.md`) to include external standards (testing, API rules).", "Keep topic files in `.claude/rules/` (e.g. `testing.md`)."]), "layers"),
      no("Avoid", ["Putting team or project standards only in a user-level `CLAUDE.md`: teammates never receive them."])
    )
  ),
  card(
    { n: "3.2", title: "Custom slash commands & skills", sub: "Reusable workflows with the right scope and configuration.", ic: "terminal", c: "rose", w: 6 },
    stack(
      pnl("Slash commands", kv([
        { tag: "Project\n`.claude/commands/`", t: "blue", items: ["Shared via version control", "Team-wide availability"] },
        { tag: "Personal\n`~/.claude/commands/`", t: "violet", items: ["Personal use only", "Not shared"] },
      ], true), "terminal"),
      pnl("Skills", kv([
        { tag: "Project\n`.claude/skills/<name>/SKILL.md`", t: "blue", items: ["Reusable workflows", "On-demand (not always loaded)", "Frontmatter config"] },
        { tag: "Personal\n`~/.claude/skills/`", t: "amber", items: ["Personal variants", "Use distinct names", "Not shared"] },
      ], true), "gear")
    ),
    pnl("Frontmatter options (SKILL.md)", `<div class="cs-cols">${code(`---
<span class="k">name</span>: <span class="s">my-skill</span>
<span class="k">context</span>: <span class="s">fork</span>
<span class="k">allowed-tools</span>: <span class="s">["Read", "Grep"]</span>
<span class="k">argument-hint</span>: <span class="s">"&lt;description&gt;"</span>
---`)}${bul(["`context: fork` → isolates verbose skill output from the main conversation.", "`allowed-tools` → restricts tool access.", "`argument-hint` → guides required parameters."])}</div>`, "braces"),
    tip("Rule of thumb", p("Skills = on-demand, task-specific workflows. `CLAUDE.md` = always-loaded general guidance."))
  ),
  card(
    { n: "3.3", title: "Path-specific rules for conditional loading", sub: "Apply rules only to matching files to cut irrelevant context.", ic: "filter", c: "green", w: 6 },
    cols(
      ok("How it works", [
        "Put rule files in `.claude/rules/` with YAML frontmatter.",
        "Use glob patterns in the `paths` field.",
        "Rules load only when Claude works on matching files.",
        "Reduces irrelevant context and token usage.",
      ]) +
        pnl("Example", code(`---
<span class="k">paths</span>:
  - <span class="s">"**/*.test.tsx"</span>
  - <span class="s">"src/api/**"</span>
---`), "doc"),
      ok("Use glob patterns for broad conventions", ["Patterns like `**/*.test.tsx` work when conventions span many directories."]) +
        no("Avoid", ["Relying only on directory-level `CLAUDE.md` when you need file-type-specific rules."])
    )
  ),
  card(
    { n: "3.4", title: "Plan mode vs direct execution", sub: "Choose the mode by task complexity.", ic: "map", c: "amber", w: 6 },
    cols(
      ok("Plan mode", ["Complex tasks touching many files", "Architecture decisions", "Migrations and large-scale changes", "Several valid approaches", "Explore safely before making changes"]) +
        pnl("Example use cases", bul(["Library migration", "Microservice restructuring", "Changes affecting many files", "Evaluating different approaches"]), "map"),
      ok("Direct execution", ["Simple, well-scoped changes", "Small edits or single-function fixes", "Clear requirements", "Add a validation check or minor bug fix"]) +
        pnl("Example use cases", bul(["Fix a single bug", "Add a small feature", "Update a few lines"]), "zap")
    ),
    pnl("Explore subagent", p("Use the Explore subagent to isolate verbose discovery output and keep the main conversation focused."), "compass")
  ),
  card(
    { n: "3.5", title: "Iterative refinement techniques", sub: "Structured techniques that improve results over time.", ic: "target", c: "violet", w: 6 },
    steps([
      ["Provide 2–3 concrete input/output examples", "When natural-language descriptions are ambiguous."],
      ["Write tests first", "Cover expected behaviour, edge cases and performance."],
      ["Share test failures with Claude", "Iterate using the actual failures to guide improvements."],
      ["Use the interview pattern", "Let Claude ask questions to surface missing requirements and failure modes."],
      ["Address interacting issues together", "Fix related issues in a single pass; handle independent issues sequentially."],
    ])
  ),
  card(
    { n: "3.6", title: "CI/CD integration", sub: "Run Claude Code in automated pipelines with structured output.", ic: "database", c: "blue", w: 6 },
    tiles([
      { ic: "terminal", t: "blue", b: "Non-interactive execution", s: "Use `-p` (or `--print`) to run Claude Code in CI without interactive input." },
      { ic: "users", t: "violet", b: "Independent review", s: "Use a separate review instance instead of reviewing in the generation session." },
      { ic: "braces", t: "teal", b: "Structured output", s: "Use `--output-format json` and `--json-schema` for machine-readable, constrained output." },
      { ic: "repeat", t: "amber", b: "On reruns", s: "Include previous findings and report only new or unresolved issues to avoid duplicate comments." },
      { ic: "folder", t: "rose", b: "Project context", s: "`CLAUDE.md` gives CI the testing standards, fixtures and review criteria." },
      { ic: "database", t: "green", b: "Existing tests / fixtures", s: "Provide existing test files in context to avoid generating duplicate tests." },
    ])
  ),
  card(
    { title: "Key takeaways", w: 12 },
    nlist([
      "`CLAUDE.md` = always-loaded general standards.",
      "Skills = on-demand, task-specific workflows.",
      "Plan mode = complex changes and exploration.",
      "Direct execution = simple, well-scoped changes.",
      "`.claude/rules/` with glob `paths` = rules load only for matching files.",
      "`-p` runs Claude Code non-interactively in CI.",
      "JSON Schema guarantees structured output, not semantic truth.",
      "Use a separate instance for independent reviews.",
      "Provide examples, use tests and iterate with feedback.",
      "Include previous findings on reruns to avoid duplicates.",
    ], "amber")
  ),
];

/* ======================================================================= */
const d4 = [
  card(
    { n: "4.1", title: "Precision & false positives", sub: "Reduce false positives and improve accuracy.", ic: "target", c: "rose" },
    ok("Do", [
      "Use explicit detection criteria.",
      "Define clear rules (with a concrete example) for each severity level.",
      "Add examples of acceptable patterns that should NOT be reported.",
      "If a category has repeated false positives, disable it temporarily, refine it and test.",
    ]),
    no("Avoid", ["Vague or general instructions (\"be conservative\").", "Inconsistent severity definitions.", "Relying on high confidence alone, without clear criteria and evidence."])
  ),
  card(
    { n: "4.2", title: "Few-shot prompting", sub: "Use examples to guide Claude's behaviour.", ic: "doc", c: "violet" },
    ok("How it helps", [
      "Provide representative input/output examples.",
      "Include ambiguous cases and edge cases.",
      "Show correct labels, especially for easily confused categories.",
    ]),
    pnl("Example", `<div class="cs-cols">${pnl("", `<p><b>Input</b></p><p><code>Password stored in plain text</code></p>`)}${code(`{
  <span class="k">"category"</span>: <span class="s">"Security"</span>
}`)}</div>`, "arrowRight"),
    tip("Remember", p("Examples teach Claude the pattern better than instructions alone."))
  ),
  card(
    { n: "4.3", title: "Structured output", sub: "Consistent, machine-readable results.", ic: "gear", c: "amber" },
    cols(
      pnl("JSON", p("The actual output format.") + code(`{
  <span class="k">"severity"</span>: <span class="s">"high"</span>,
  <span class="k">"file"</span>: <span class="s">"LoginViewModel.swift"</span>,
  <span class="k">"line"</span>: <span class="s">42</span>,
  <span class="k">"message"</span>: <span class="s">"Missing error handling"</span>
}`), "braces"),
      pnl("JSON Schema", p("Defines required fields, types and constraints.") + code(`{
  <span class="k">"type"</span>: <span class="s">"object"</span>,
  <span class="k">"required"</span>: [<span class="s">"severity"</span>,
    <span class="s">"file"</span>, <span class="s">"line"</span>, <span class="s">"message"</span>]
}`), "list")
    ),
    pnl("Validation levels", steps([["Schema validation", "Checks structure, required fields and data types."], ["Semantic validation", "Checks the finding is actually correct and matches the code and criteria."]]), "layers"),
    tip("Valid structure ≠ valid content", p("JSON can be schema-valid and still contain an incorrect finding."))
  ),
  card(
    { n: "4.4", title: "Validation, retry & feedback", sub: "Handle invalid outputs reliably.", ic: "loop", c: "green" },
    cols(
      steps([
        ["Validate", "Check the output against the schema and rules."],
        ["Provide specific feedback", "Send Claude the exact validation errors."],
        ["Retry with a limit", "Allow a limited number of correction attempts."],
        ["Handle failure", "If retries run out, fail gracefully and take an appropriate action."],
      ]),
      pnl("Example error feedback", p("Validation errors:") + bul(["`severity` must be one of: critical, high, medium, low", "`line` must be an integer"]) + p("Correct the output to satisfy the schema."), "alert")
    ),
    cols(ok("Works well for", ["Invalid JSON", "Missing required fields", "Schema violations"]), no("May not be enough for", ["Incorrect business logic", "Issues that need deeper reasoning"]))
  ),
  card(
    { n: "4.5", title: "Message Batches", sub: "Process many requests efficiently.", ic: "database", c: "blue" },
    ok("Use when", ["Large numbers of independent requests.", "Results aren't needed immediately.", "Reducing API cost is a priority (50% of standard price)."]),
    no("Avoid when", ["A response is needed immediately (a user is waiting).", "The next step depends on the current result.", "A tight deadline needs synchronous processing (batches only promise ≤ 24 h)."]),
    pnl("Example", `<div class="tiles" style="grid-template-columns:1fr">
      <div class="tile" style="--t:var(--ok)">${icon("moon")}<div><b>Good fit</b><span>Classify 5,000 support tickets overnight.</span></div></div>
      <div class="tile" style="--t:var(--no)">${icon("zap")}<div><b>Not a good fit</b><span>Review a PR while the developer waits for results.</span></div></div>
    </div>`, "info")
  ),
  card(
    { n: "4.6", title: "Multi-instance & multi-pass review", sub: "Improve review quality and coverage.", ic: "users", c: "violet" },
    pnl("Multi-instance (independent review)", flow([{ b: "Instance A", s: "Generates code", t: "blue" }, { b: "Instance B", s: "Reviews code (independent context)", t: "green" }]) + `<ul class="ticks" style="margin-top:8px"><li>Use a separate review instance to reduce bias from the generation session's context.</li></ul>`, "users"),
    pnl("Multi-pass review", p("Break complex reviews into focused passes.") + flow([{ b: "Pass 1", s: "Correctness (bugs, logic)", t: "rose" }, { b: "Pass 2", s: "Security (vulnerabilities)", t: "amber" }, { b: "Pass 3", s: "Performance (expensive ops)", t: "amber" }]), "layers")
  ),
  card(
    { title: "Key takeaways", w: 6 },
    nlist([
      "Be explicit and provide clear criteria.",
      "Use examples to guide Claude's behaviour.",
      "Enforce structured outputs and validate them.",
      "Use actionable feedback with limited retries.",
      "Choose the right processing method (sync vs batches).",
      "Use independent instances and multi-pass reviews for higher quality.",
    ], "blue")
  ),
  card(
    { title: "Do vs don't", w: 6 },
    dd(
      ["Use clear, specific prompts.", "Provide representative examples.", "Define structured outputs with JSON Schema.", "Validate and give specific feedback.", "Batch high-volume, non-urgent tasks.", "Use separate instances and multi-pass reviews."],
      ["Use vague instructions.", "Rely on high confidence alone.", "Assume schema validity means correctness.", "Retry without feedback.", "Use batches for time-critical requests.", "Review in the same session that generated the code."]
    )
  ),
];

/* ======================================================================= */
const d5 = [
  card(
    { n: "5.1", title: "Manage conversation context across long interactions", sub: "Keep critical information without losing details.", ic: "chat", c: "blue" },
    ok("Key points", [
      "Progressive summarisation can lose important details (numbers, dates, percentages, customer expectations).",
      "Place key facts early and use explicit section headers.",
      "Keep structured data separate (case facts vs summary).",
      "Trim tool outputs to the relevant fields before adding them to context.",
      "Include metadata (dates, sources, methodology) in structured outputs.",
    ]),
    cols(
      pnl("Info at risk during summarisation", tiles([
        { ic: "dollar", t: "teal", b: "Numeric values", s: "Amounts, percentages" },
        { ic: "calendar", t: "rose", b: "Dates & deadlines", s: "" },
        { ic: "user", t: "blue", b: "Customer expectations", s: "" },
        { ic: "doc", t: "violet", b: "Order numbers / statuses", s: "" },
      ]), "alert"),
      tip("Best practice", bul(["Extract key facts into a persistent \"case facts\" block.", "Use structured formats (tables / JSON) for critical data.", "Place summaries at the beginning of aggregated inputs."])) +
        no("Avoid", ["Relying only on long conversations without structure.", "Letting important details get buried in the middle."])
    )
  ),
  card(
    { n: "5.2", title: "Escalation & ambiguity resolution", sub: "Know when to escalate and how to handle ambiguity.", ic: "alert", c: "rose" },
    ok("Key points", [
      "Escalate for human help, policy exceptions, or when meaningful progress isn't possible.",
      "Tell apart escalating immediately (when explicitly requested) and attempting to resolve straightforward issues.",
      "Multiple customer matches need clarification: ask for another identifier.",
      "Acknowledge frustration and respond within the agent's capabilities.",
    ]),
    no("Avoid", ["Escalating on silent or ambiguous requests.", "Using sentiment or low confidence as the only reason to escalate.", "Assuming you can resolve policy exceptions automatically."]),
    pnl("Escalation triggers", tiles([
      { ic: "headset", t: "blue", b: "Customer requests a human", s: "" },
      { ic: "doc", t: "rose", b: "Policy exceptions / gaps", s: "" },
      { ic: "help", t: "amber", b: "No meaningful progress", s: "" },
      { ic: "users", t: "violet", b: "Ambiguous customer match", s: "Ask for an identifier first" },
    ]), "flag")
  ),
  card(
    { n: "5.3", title: "Error propagation across multi-agent systems", sub: "Structured error context for intelligent recovery.", ic: "gear", c: "amber" },
    ok("Key points", [
      "Return structured error context (failure type, attempted query, partial results, alternatives).",
      "Distinguish access failures (retry) from valid empty results (success with no matches).",
      'Avoid generic errors like "search unavailable".',
      "Do not silently suppress errors or terminate entire workflows on single failures.",
    ]),
    no("Avoid", ["Generic error messages.", "Returning empty results as success.", "Only propagating errors that can't be resolved locally (share attempted steps and partial results)."]),
    pnl("Structured error context includes", code(`{
  <span class="k">"error_type"</span>: <span class="s">"timeout | validation | permission"</span>,
  <span class="k">"attempted_query"</span>: <span class="s">"…"</span>,
  <span class="k">"partial_results"</span>: [<span class="s">…</span>],
  <span class="k">"possible_alternatives"</span>: [<span class="s">…</span>],
  <span class="k">"can_retry"</span>: <span class="s">true | false</span>
}`), "braces")
  ),
  card(
    { n: "5.4", title: "Context in large codebase exploration", sub: "Manage context to avoid degradation in long sessions.", ic: "folder", c: "green" },
    cols(
      ok("Key points", [
        'Models may give inconsistent answers in long sessions (falling back to "typical patterns").',
        "Use scratchpad files to persist key findings across context boundaries.",
        "Delegate verbose exploration to subagents.",
        "Summarise findings from one phase before spawning subagents for the next.",
        "Use compact representations to reduce context usage.",
      ]),
      pnl("Pattern for large exploration", vflow([
        { b: "Explore", s: "collect findings", t: "blue" },
        { b: "Summarise", s: "key findings", t: "amber" },
        { b: "Spawn subagents", s: "next phase", t: "violet" },
        { b: "Persist", s: "scratchpad / manifest", t: "green" },
      ]), "route")
    ),
    no("Avoid", ["Letting context grow with irrelevant files.", "Relying on long reasoning chains instead of structured summaries."])
  ),
  card(
    { n: "5.5", title: "Human review workflows & confidence calibration", sub: "When to involve humans and how to measure reliability.", ic: "chart", c: "rose" },
    cols(
      ok("Key points", [
        "Aggregate metrics (e.g. 97% overall) can hide document-type issues.",
        "Use stratified sampling to measure error rates and find novel error patterns.",
        "Calibrate confidence scores with labelled validation sets.",
        "Validate accuracy by document type and field before automating high-confidence extractions.",
        "Route low-confidence or ambiguous/contradictory extractions to human review.",
      ]),
      pnl("Validation approach", vflow([
        { b: "Stratified sampling", s: "across document types", t: "blue" },
        { b: "Measure error rates", s: "find patterns", t: "rose" },
        { b: "Calibrate confidence", s: "with a labelled dataset", t: "amber" },
        { b: "Route to human review", s: "low confidence / contradictions", t: "teal" },
      ]), "chart")
    ),
    no("Avoid", ["Relying only on aggregate accuracy.", "Automating high-confidence extraction without validation.", "Ignoring contradictory sources."])
  ),
  card(
    { n: "5.6", title: "Information provenance & uncertainty handling", sub: "Preserve source attribution and handle conflicting info.", ic: "doc", c: "violet" },
    ok("Key points", [
      "Source attribution can be lost during summarisation: preserve claim → source mappings.",
      "Require publication / collection dates for temporal data.",
      "Handle conflicting statistics by annotating them with sources, not picking a single value.",
      "Include source URLs, document names and relevant excerpts in structured outputs.",
      "Render each content type appropriately (tables, lists, prose).",
    ]),
    no("Avoid", ["Compressing multiple sources into one undifferentiated summary.", "Ignoring date requirements for time-sensitive data.", "Using a single value when sources conflict."])
  ),
  card(
    { title: "Key takeaways", w: 6 },
    nlist([
      "Preserve critical details (numbers, dates, expectations) in structured formats.",
      "Use explicit summaries and section headers.",
      "Know when to escalate vs resolve.",
      "Return structured error context and handle failures properly.",
      "Use scratchpad files and subagents for large explorations.",
      "Calibrate confidence and validate before automation.",
      "Preserve source attribution and handle conflicting information.",
    ], "blue")
  ),
  card(
    { title: "Do vs don't", w: 6 },
    dd(
      ["Keep structured case facts.", "Include metadata and sources.", "Trim tool outputs to relevant fields.", "Use explicit escalation criteria.", "Return detailed error context.", "Persist key findings (scratchpad).", "Validate with stratified sampling.", "Annotate conflicting sources.", "Handle temporal data with dates."],
      ["Let key details get lost in summaries.", "Use generic error messages.", "Suppress errors or stop workflows early.", "Rely on aggregate metrics only.", "Ignore contradictory sources.", "Let context grow with irrelevant information.", "Pick a single value when sources conflict."]
    )
  ),
];

export const SHEETS = {
  1: { sub: "Loops, coordinators, subagents, hooks, decomposition and sessions.", cards: d1 },
  2: { sub: "Tool descriptions, structured errors, tool scoping, MCP servers and built-in tools.", cards: d2 },
  3: { sub: "Configure Claude Code for productive, consistent and scalable development workflows.", cards: d3 },
  4: { sub: "Make Claude's output accurate, consistent, machine-readable and production-ready.", cards: d4 },
  5: { sub: "Keep the right information, handle uncertainty and build reliable agents.", cards: d5 },
};
