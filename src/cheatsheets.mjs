// The five one-page cheat tables, rebuilt from the quick-reference images as HTML/CSS.
// Corrections vs the images: Domain 4 is "Prompt Engineering & Structured Output" (image said
// "Build Effective Agents"), Domain 5 weighs 15% (image said 18%), and tool_choice "none" is added.
// The images' "exam trigger → what to choose" tables are left out; the decision tables at the end of this
// file (symptom → usual answer, built with the group's study guide) cover that ground instead.
import { md, esc, icon } from "./lib.mjs";

const C = { blue: "var(--d1)", teal: "var(--d2)", amber: "var(--d3)", rose: "var(--d4)", violet: "var(--d5)", green: "var(--success)", red: "var(--danger)" };
const col = (c) => C[c] || c;

// A card is a bordered box; its number takes the sheet's domain colour (set on the grid).
// Task cards get an anchor (#c-5-1, used by the page's jump bar), a button that opens that task's summary
// (build.mjs adds a pill after it that opens that task's decision table rows).
const card = ({ n, title, sub, w = 4 }, ...kids) =>
  `<section class="Box cs-card${w === 4 ? "" : " w" + w}"${n ? ` id="c-${n.replace(".", "-")}"` : ""}>
  <header class="cs-h"><span class="n">${n ? esc(n) : ""}</span><h2>${md(title)}</h2>${n ? `<button type="button" class="sum-mini" data-sum="${esc(n)}" title="Summary of ${esc(n)}" aria-label="Summary of ${esc(n)}">${icon("book")}</button>` : ""}${sub ? `<p>${md(sub)}</p>` : ""}</header>
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

/* Decision tables: the usual answer for each symptom a question describes, one table per domain, grouped by
   task statement ({ "1.1": [[symptom, answer], …] }). Built with the study guide the group shared, plus the
   lessons of the exam traps rephrased as decisions; reworded, and checked against the notes.
   cheatsheets.ar.mjs must have the same rows in the same order: each row shows both languages. */
const decide = {
  1: {
    "1.1": [
      ["The loop never stops, or stops too early", 'Drive the loop with `stop_reason`: continue on `"tool_use"`, stop on `"end_turn"`'],
      ["The response has text and a `tool_use` block", 'Not finished: `stop_reason` is `"tool_use"`, so run the tool; never decide from text or wording'],
      ['Claude replies with `"end_turn"` on the very first request', "A correct finish; there's no minimum number of tool calls"],
      ["The run ends with `error_max_turns`", "Cut off, not finished: end the loop on `stop_reason`; `max_turns` is only a backstop"],
      ['Building the next request after a `"tool_use"` response', "Resend the full assistant response, `tool_use` blocks included, then a user message with one `tool_result` per `tool_use_id`"],
      ["The same tools run in the same fixed order every time", "That's a workflow; it's an agent only when Claude picks each next action from the history"],
    ],
    "1.2": [
      ["A subagent ignores a decision the user made earlier", "Put the decision in the delegation prompt; resuming it, wider tools or a system prompt rule won't help"],
      ["Every subagent succeeded, but whole subtopics are missing", "The coordinator's decomposition is too narrow"],
      ["Splitting a broad research question among subagents", "Facets that together cover the whole question without overlap, not many narrow slivers"],
      ["The coordinator has merged the first round of results", "Send a targeted query per gap and re-check; stop on an explicit coverage test, `maxTurns` and a session budget"],
      ["The full subagent pipeline runs on every request, even simple ones", "Add a cheap analysis step that calls only the needed subagents; running all in parallel still pays for each"],
    ],
    "1.3": [
      ["The coordinator can't spawn subagents", "Add `Task` to the coordinator's `allowedTools`"],
      ["Subagents run one after another instead of in parallel", "Several `Task` calls in one coordinator response"],
      ["A subagent's output is generic or has no sources", "Put the earlier findings and their metadata in the subagent's prompt"],
      ["A subagent must never modify files", "Set `tools` in its own definition, e.g. `[\"Read\", \"Grep\"]`, not a prompt line, its description or the coordinator's `allowedTools`"],
      ["A subagent definition leaves `tools` unset", "It gets every tool subagents can use, write and edit tools included"],
      ["Subagents misread a terse goal or duplicate each other's searches", "A specific delegation: objective, output format, tool and source guidance, and clear task boundaries"],
    ],
    "1.4": [
      ["The agent skips a mandatory earlier step", "A prerequisite gate in code that blocks the tool call, not a stronger prompt, few-shot examples or a bigger model"],
      ["Recording that the customer passed verification", "A `PostToolUse` hook on `get_customer` storing the ID it actually returned, not `PreToolUse`, which fires before the lookup"],
      ["Where to block a refund for an unverified customer", "A `PreToolUse` hook on `process_refund` that denies without a matching record (fail closed); `PostToolUse` runs after the money moved"],
      ["Several hooks match the same event", "They run in parallel with no set order; each gate loads its own state"],
      ["A `.*refund` matcher also gates `issue_refund_note`", "Use the exact name `process_refund` or the anchored `^process_refund$`"],
      ["Handing off to a human who can't see the transcript", "A structured handoff summary: customer ID, root cause, amount, recommended action"],
    ],
    "1.5": [
      ["A policy limit (such as a refund cap) is sometimes exceeded", "A `PreToolUse` hook that intercepts the call and blocks or redirects it"],
      ["After a deny, the agent retries the same call", 'Keep `"deny"` and make `permissionDecisionReason` name the next tool, such as `escalate_refund`'],
      ["A rule depends on the call's arguments, such as amount or category", "Match the tool name, then check `tool_input` in the callback; matchers see only tool names"],
      ["One hook for every tool on the billing MCP server", "Matcher `mcp__billing__.*`, not `billing` or `^mcp__billing__$`"],
      ["Tool results come back in mixed formats", "A `PostToolUse` hook that normalizes them before the model sees them"],
      ["Replacing a tool's output, built-in or MCP, before Claude reads it", "Return it in `updatedToolOutput`, not `updatedMCPToolOutput`, which covers MCP tools only"],
    ],
    "1.6": [
      ["A large multi-file review is shallow and contradicts itself", "One pass per file, plus a separate cross-file integration pass, not a bigger context window"],
      ["The subtasks are known and the same on every run", "A fixed chain or fan-out sequenced in code, not an orchestrator that re-plans each run"],
      ["Steps must run in order, with checks between them", "Each step its own API call, sequenced by code; a system prompt listing the steps isn't a pipeline"],
      ["An open-ended investigation where findings decide the next step", "An orchestrator that derives each next subtask from the latest findings, with an explicit stop rule, not preset parallel subagents"],
      ["Adding comprehensive tests to a legacy codebase", "Dynamic decomposition: map the structure, rank areas by impact, and revise the plan as dependencies appear"],
    ],
    "1.7": [
      ["Return to yesterday's named session with full context", "`claude --resume <name>`, not `--continue` (newest session), the bare picker or a pasted summary"],
      ["A service must reconnect each of many users to their own session", "Store a `session_id` per user and pass it as `resume`, not `continue_conversation=True`"],
      ["Resuming after files have changed", "Resume and name the changed files; start fresh with a summary if the old results are stale"],
      ["Compare two approaches from the same starting analysis", "`fork_session`"],
      ["Standalone `fork_session()` returned an ID, but nothing runs", "It only writes the forked transcript; pass the ID to `ClaudeAgentOptions(resume=...)` to work on the branch"],
      ["A `--fork-session` fork asks you to approve commands again", "Expected: 'allow for this session' grants stay with the original, and plan mode doesn't carry over"],
    ],
  },
  2: {
    "2.1": [
      ["The agent picks the wrong one of two similar tools", "Expand and differentiate the tool descriptions as the first step; tool order and routing priority don't matter"],
      ["Descriptions are clearly distinct, but calls still misroute", "Look for keyword-triggered instructions or emphatic 'MUST' rules in the system prompt"],
      ["Two tools' descriptions overlap and both claim the same requests", "Rename and rescope each; say when to pick it over its sibling and which case is the other's"],
      ["One tool does several unrelated things", "Split it into purpose-specific tools with defined inputs and outputs"],
      ["Inputs are nested or format-sensitive", "Add schema-valid `input_examples` on top of a full description, never instead of one"],
    ],
    "2.2": [
      ["A tool ran but failed (bad input, upstream API down)", "Return a normal result with `isError: true`; JSON-RPC errors are only for requests that never reached a working tool"],
      ["A tool returns only a generic 'Operation failed'", "Add `errorCategory`, `isRetryable` and a specific description so the agent can pick a recovery"],
      ["Deciding whether an error is retryable", "`isRetryable: true` only for `transient` errors (timeouts, rate limits); anything that must change first means false"],
      ["A required field is missing or has the wrong format", "`errorCategory: validation`, `isRetryable: false` even though the agent can fix it; name the field"],
      ["The token lacks the required role", "`errorCategory: permission`, `isRetryable: false`; get a credential with the right role or escalate"],
      ["The agent keeps retrying a request that breaks a policy", "Return `errorCategory: business`, `isRetryable: false` and a customer-friendly explanation"],
      ["'No matching orders' is treated as a failure", "A valid empty result, not an error; `isError` is for queries that couldn't run (timeout, no access)"],
      ["The coordinator can't tell how to recover from a subagent failure", "Structured error context: failure type, what was tried, partial results, alternatives"],
    ],
    "2.3": [
      ["An agent with 18 tools keeps misusing them", "Scope tools by role (about 4 to 5 each), plus a few cross-role tools"],
      ["An agent calls tools outside its role (a QA agent deploys)", "Remove them from its `tools` list and keep `tool_choice` at `auto`; `any` or `none` won't help"],
      ["The synthesis agent sometimes needs to check a fact", "A narrow `verify_fact` tool for simple checks; the coordinator for the rest"],
      ["You must get a tool call, not a text reply", '`tool_choice: "any"`: some tool is guaranteed, but the model picks which'],
      ["One specific tool must run first", '`tool_choice: {"type": "tool", "name": "..."}` on the first turn, then `auto` or `any`'],
      ["Requiring a tool call returns an error or a 400", "Check the model and thinking setup; use `auto` with strict tool use or structured outputs instead"],
      ["Forcing a tool with adaptive thinking (e.g. Claude Opus 5)", "Allowed, but the response opens with the tool call and no thinking block; use `auto` to keep it"],
    ],
    "2.4": [
      ["The team needs a shared MCP server", "Project scope: `.mcp.json` in the repo, with secrets as `${ENV_VAR}`"],
      ["A personal or experimental MCP server", "User scope (or local, for one repo) in `~/.claude.json`, not `.mcp.json`"],
      ["A server added without `--scope` is missing for teammates", "Default scope is `local` (your `~/.claude.json`, this repo only); add it with `--scope project`"],
      ["Giving `${VAR}` references in `.mcp.json` a fallback", "Use `${VAR:-default}` for non-secrets only; unset variables don't block loading, so secrets get no default"],
      ["The same server name exists in local and project scope", "One whole definition loads (your local one), no field merging; remove the other with `claude mcp remove <name> --scope <scope>`"],
      ["A server uses a custom token scheme with no OAuth server (e.g. Kerberos)", "`headersHelper`, a script that mints the token and returns the header; not an `oauth` block or a proxy service"],
      ["The agent uses Grep instead of your better MCP tool", "Improve its description: what it returns, when to use it over Grep, parameters and limits"],
      ["The agent spends turns working out what data exists", "Expose a content catalog as an MCP resource"],
      ["A standard integration such as Jira", "Use the existing community MCP server"],
    ],
    "2.5": [
      ["Find where a function is called", "Grep"],
      ["Find all `*.test.tsx` files", "Glob"],
      ["Find components with no test file (`Button.test.tsx` convention)", "Glob the components, Glob the `*.test.tsx` files, compare the lists; not Grep for 'test'"],
      ["Running tests, builds, git or package managers", "Bash; for finding files or text use Glob or Grep, not `find | xargs grep`"],
      ["Tracing a flow through an unfamiliar codebase", "Read `CLAUDE.md`, Grep for the entry point, then Read along the imports; don't load everything"],
      ["Edit fails because `old_string` matches more than once", "Add neighbouring lines until it's unique; `replace_all: true` changes every copy"],
      ["Edit has no unique text to anchor on (generated or repeated code)", "Read the whole file, then Write it all back: Write replaces the entire file"],
      ["Edit fails because the file changed since your last Read", "Read it again and rebuild the Edit from the current contents"],
    ],
  },
  3: {
    "3.1": [
      ["Teammates don't get your instructions", "They're in `~/.claude/CLAUDE.md`; move them into the project and commit"],
      ["Is `./.claude/CLAUDE.md` personal or shared?", "Shared: it's project level like `./CLAUDE.md`; only `~/.claude/CLAUDE.md` is user level"],
      ["Compliance rules every developer must get and can't remove", "IT deploys a managed CLAUDE.md or `managed-settings.json`; instructions guide, settings like `permissions.deny` enforce"],
      ["Which CLAUDE.md files load when a session starts?", "The launch directory's and its ancestors'; subdirectory files load when Claude reads files there"],
      ["Which memory files are loaded? Behaviour differs between sessions?", "`/memory` (the exam's answer; current Claude Code also shows this in `/context`)"],
      ["CLAUDE.md has grown into one huge file", "Split it into `.claude/rules/` topic files, or `@import` the pieces"],
    ],
    "3.2": [
      ["A command every developer should get on clone", "`.claude/commands/` in the repo (or `.claude/skills/`), committed"],
      ["A skill works for you, but teammates don't have it", "It's in `~/.claude/skills/` or unstaged; commit it under the project's `.claude/skills/<name>/`"],
      ["The same skill name exists at several levels", "Exactly one runs, no merge or error: enterprise, then personal, then project; a skill beats a same-name command file"],
      ["You want your own variant of a team skill", "Copy it to `~/.claude/skills/` under another name; the same name silently overrides the team's"],
      ["A skill's output floods the main conversation", "`context: fork` in the skill's frontmatter, not `disable-model-invocation`, `user-invocable` or `paths`"],
      ["Only people, not Claude, should start a skill", "`disable-model-invocation: true` (`user-invocable: false` is the reverse: Claude only); neither isolates output"],
      ["A skill must not be able to run destructive commands", "`allowed-tools` in the frontmatter (the exam's answer; current Claude Code treats it as pre-approval and uses `disallowed-tools` to remove tools)"],
      ["A skill is invoked without its arguments", "`argument-hint`"],
      ["Standards that always apply", "CLAUDE.md"],
      ["A workflow needed only for a specific task", "A skill, loaded on demand"],
    ],
    "3.3": [
      ["Conventions for one file type spread across directories", "One `.claude/rules/` file with a `paths` glob like `**/*.test.tsx`, not a CLAUDE.md per folder"],
      ["Conventions for a single directory", "A CLAUDE.md in that subdirectory"],
      ["CLAUDE.md should cost less context at startup", "Move area-specific guidance into a `paths`-scoped rule or a subdirectory CLAUDE.md; `@path` imports still load at start"],
      ["A rule's frontmatter uses `include` or `globs` instead of `paths`", "Not scoped: it loads every session; `paths` is the only frontmatter key Claude Code reads"],
      ["A glob must also reach nested folders", "Use `**`: `terraform/**/*`, not `terraform/*`; a single `*` matches one directory level only"],
      ["A rule meant only for `src/api/` files", "Anchor at the narrowest folder: `src/api/**/*.ts`, not `src/**/*.ts`, which also loads for unrelated files"],
    ],
    "3.4": [
      ["An architectural change across many files", "Plan mode"],
      ["A small change, but several approaches are still undecided", "Plan mode to choose the approach, then make the small change directly"],
      ["A single-file fix with a clear stack trace", "Direct execution"],
      ["A large change: is planning first worth the extra step?", "Yes: it fixes one pattern before edits; a flaw caught in the plan costs one message, not redone files"],
      ["You want to review a large restructuring's design", "Plan mode before any edits, not a PR from a headless `bypassPermissions` run (that's for isolated containers/VMs)"],
      ["The plan is approved and ready to implement", "Switch to an editing mode and execute against the plan; staying in plan mode blocks the edits"],
      ["Plan mode reads file after file with no prompts", "Working as designed: reads are allowed, edits held until approval; the mode never switches by itself"],
      ["Discovery output is using up the context window", "The Explore subagent"],
    ],
    "3.5": [
      ["A prose spec keeps being misread", "2 to 3 concrete input/output examples from real data, covering edge cases, not a longer description"],
      ["An unfamiliar domain with unknown risks", "The interview pattern: let Claude ask questions first"],
      ["Independent verification of code Claude wrote", "Supply the expected outputs yourself, or have a fresh model try to refute it; Claude's own tests inherit its misreading"],
      ["An edge case is mishandled", "Pin it with an exact expected output or a failing test, not a logging try/except or a rerun of the same prompt"],
      ["Two corrections in a row have failed", "`/clear`, then restart with a better prompt that builds in what you learned; the same prompt repeats the misreading"],
      ["Several fixes that affect each other", "One detailed message covering them all and how they relate"],
      ["Several independent fixes", "One at a time, each with its exact failure text; none left out"],
    ],
    "3.6": [
      ["A CI job hangs waiting for input", "`-p` (`--print`)"],
      ["A `-p` CI job still stalls", "It's on a permission prompt: pre-approve tools with `--allowedTools`, and/or refuse the rest with `--permission-mode dontAsk`"],
      ["A headless `acceptEdits` run needs other shell commands", "Allow them via `--allowedTools` or `permissions.allow`; `acceptEdits` covers only file edits and basic filesystem commands"],
      ["You need parseable findings for PR comments", "`--output-format json` with `--json-schema`; read `.structured_output`, not `.result`"],
      ["The GitHub Action posts no inline PR comments", "Name `mcp__github_inline_comment__create_inline_comment` in `--allowedTools` within `claude_args`, not in skill frontmatter"],
      ["CI reviews ignore the project's standards", "Put the standards in CLAUDE.md"],
      ["A re-review posts duplicate comments", "Include the earlier findings; report only new or unfixed issues"],
      ["Generated tests duplicate existing ones", "Include the existing test files"],
    ],
  },
  4: {
    "4.1": [
      ["Vague review instructions give inconsistent findings", "Explicit criteria: which issues to report and which to skip"],
      ["Too many false positives from a review prompt", "Spell out the categories to report and skip, not 'be conservative' or 'only high-confidence findings'"],
      ["Severity labels are inconsistent", "Define each level by its consequences, with one concrete code example each"],
      ["One category has many false positives and trust is dropping", "Turn that category off for now and fix its prompt"],
      ["When to turn a disabled category back on", "When its rewritten criteria score well on known-answer cases (recall or F1), not when comments drop"],
      ["The reviewer flags code that differs from the legacy style around it", "Judge style and naming against the documented standard (e.g. `CLAUDE.md`), flagging only new violations"],
      ["One category's threshold bleeds into another's", "Wrap each category's rules and examples together in its own descriptively named XML tag, such as `<security_criteria>`"],
    ],
    "4.2": [
      ["The output format varies between runs", "Few-shot examples showing the exact format; not temperature 0, a longer checklist or a reformatting call"],
      ["Criteria are clear, but ambiguous cases go wrong", "2 to 4 few-shot examples that show the reasoning"],
      ["Extraction fails on documents with different layouts", "Few-shot examples covering those layouts"],
      ["Extraction invents values and every few-shot example is fully filled", "Add partial records, vague values kept as written, absent ones marked not specified; let it admit uncertainty"],
      ["The example list grows with every misclassified edge case", "Use a few diverse, canonical examples, each showing why it got its label"],
      ["Adding examples made long or non-English inputs regress", "Diversify them across length, language, structure and edge cases; don't delete or duplicate them"],
    ],
    "4.3": [
      ["Malformed JSON breaks the parser", "`tool_use` with a JSON schema"],
      ["Document type unknown, several schemas", '`tool_choice: "any"`'],
      ["One extraction must run before enrichment", "Force that tool by name with `tool_choice`; `any` lets Claude pick a different tool"],
      ["Claude must reason in text before the extraction call", "Use `auto` with an instruction, accepting the call isn't guaranteed; forcing allows no text or thinking first"],
      ["The model invents values for missing data", "Make those fields optional / nullable; a required field pushes it to invent one"],
      ["A value fits no enum category", '`"other"` plus a detail string; `"unclear"` for ambiguous cases'],
    ],
    "4.4": [
      ["Schema-valid JSON, but totals don't add up or a value is misplaced", "Semantic validation in your code (`calculated_total` vs `stated_total`), not a stricter schema, more examples or temperature 0"],
      ["Validation failed: retry?", "Yes for format or structure errors; no if the information isn't in the source"],
      ["Retries keep producing the same error", "Send the specific validation errors with the original document and the failed extraction"],
      ["A required field stays empty through retries; the source lacks the value", "Stop retrying (a bigger model won't help): make it nullable and escalate to a person or supply the missing document"],
      ["You need to know where false positives come from", "A `detected_pattern` field logged with each dismissal, not `dismissal_reason` or a confidence score"],
    ],
    "4.5": [
      ["A pre-merge check a developer is waiting for", "The synchronous API; batches have no latency guarantee, however fast they usually finish"],
      ["Overnight or weekly analysis", "Message Batches API: 50% cheaper, up to 24 hours, no latency guarantee"],
      ["A workflow needs a multi-turn loop that runs your own tools", "Keep it on the synchronous API; batch only single-pass steps such as triage"],
      ["Matching batch results to their requests", "Join on `custom_id`; `.jsonl` result lines come in no guaranteed order"],
      ["Part of a batch failed", "Resubmit only the failures by `custom_id` in a new batch, each with its fix (e.g. split oversized documents)"],
      ["Choosing `custom_id` values for batch requests", "Unique in the batch; 1 to 64 letters, digits, hyphens or underscores, e.g. `doc-2026-report_final`"],
      ["Sizing batches for a large job (e.g. 150,000 invoices)", "Up to 100,000 requests or 256 MB per batch; no hourly cap, and Messages API rate limits are untouched"],
    ],
    "4.6": [
      ["Reviewing code the same session or subagent wrote", "An independent instance with a fresh context (same model is fine), not the resumed writer or extended thinking"],
      ["A 14-file PR review is shallow and contradictory", "One pass per file, plus a cross-file integration pass"],
      ["Two per-file passes give conflicting recommendations", "Add a cross-file integration pass that reads both files side by side; don't ask the original author"],
      ["Where to filter noise in a multi-pass review", "In a separate verification pass; the finding pass reports every issue with confidence and severity"],
      ["PR findings must be independently verified, and the team accepts the wait", "Claude Code's Code Review: about 20 minutes, billed in usage credits; comments only, never approves or blocks"],
      ["Too few human reviewers", "Confidence per finding, calibrated on a labeled set, to prioritize their work"],
    ],
  },
  5: {
    "5.1": [
      ["Amounts, dates and order numbers turn vague in a long chat", "A persistent case-facts block outside the summarized history; a bigger window only delays the loss"],
      ["An order lookup returns 40+ fields and 5 matter", "Parse it in code and keep only the needed fields, not a character cut or a second model's summary"],
      ["Findings in the middle of a long input get dropped", "A key-findings summary at the top and a header or XML tag per section, not reordering sections"],
      ["The app sends only the newest user message each turn", "Resend the full conversation every request (the API is stateless); curate content, don't drop turns"],
      ["A downstream agent has little context to spare", "Upstream agents return structured facts and citations, not prose"],
    ],
    "5.2": [
      ["The customer says 'get me a human'", "Escalate at once, without investigating or trying a quick fix first"],
      ["The customer is angry but the issue is simple", "Acknowledge it, fix the issue and mention a human is available; hand off if they then ask"],
      ["Policy says nothing about the request (such as a competitor price match)", "Escalate to a supervisor or the policy team; don't refuse, approve (even after verifying) or guess the intent"],
      ["`get_customer` returns three matches", "Ask for another identifier (booking reference, phone, account number); never pick or merge records"],
      ["A complex, multi-step case that policy fully covers", "Keep it with the agent; escalate only on explicit request, policy gap or no progress"],
      ["The agent escalates the wrong cases", "Explicit criteria with few-shot examples in the system prompt, not sentiment or self-rated confidence"],
    ],
    "5.3": [
      ["A subagent times out", "Structured error context: type, attempted query, partial results, alternatives; not a bare code, timestamps or raw traces"],
      ["A subagent can't reach its source", "Report an error with structured context; success with zero items only for queries that actually ran"],
      ["One subagent fails while the others succeed", "Keep the valid results, recover what you can and flag the gap; don't stop the whole workflow"],
      ["A subagent hits a transient error such as `rate_limit`", "Retry locally a limited number of times; escalate only if it doesn't clear"],
      ["A subagent hits `authentication_failed`", "Report it at once with attempts, partial results and alternatives; retries or backoff won't fix a credential"],
      ["The report rests on partial coverage", "Coverage annotations separating supported findings from gaps"],
    ],
    "5.4": [
      ["Late in a session the agent cites 'typical patterns'", "Context rot: limit verbose output, keep findings in a scratchpad and read it before answering; not a bigger model or output limit"],
      ["Exploration output is filling the context window", "Delegate searches to subagents that return only the result; compacting after the flood is too late"],
      ["Several subagents record findings at the same time", "One uniquely named file per subagent; the coordinator merges them after all have finished"],
      ["An exact value such as `pool_size=12` must survive compaction", "Store it verbatim in a scratchpad file; `/compact`, even with a focus, is lossy"],
      ["A long exploration needs crash recovery", "A JSON manifest of agent status and output paths; on restart, rerun only unfinished agents, injecting finished agents' findings"],
    ],
    "5.5": [
      ["97% accuracy, and you want less human review", "Measure accuracy per document type and field first; cut review only where a segment passes on its own"],
      ["You plan to auto-accept fields above a confidence score", "Calibrate it first on a held-out labeled set; set thresholds, per field if needed, from measured accuracy"],
      ["Reviewers keep finding errors in fields scored 0.9 or higher", "Recalibrate on labeled data matching current documents, then reset thresholds; don't just raise them"],
      ["You still need to catch errors among high-confidence results", "Stratified random sampling of auto-accepted output in every type-and-field cell; feed errors back and recalibrate"],
      ["Not enough human reviewers", "Route by calibrated field-level confidence"],
    ],
    "5.6": [
      ["Citations disappear after synthesis", "Claim-source mappings kept through every step"],
      ["Defining a subagent's output format so claims stay traceable", "Each claim with its own source (name or URL) and supporting excerpt, not a document list, agent ID or bare quote"],
      ["Two credible sources disagree", "Report both, each attributed and flagged as conflicting; don't average them or pick one"],
      ["Figures look contradictory", "Require a publication or collection date on each figure; pass all values with sources to the coordinator, not just the newest"],
      ["The synthesis makes tentative findings sound settled", "Separate established from contested findings; keep each source's wording and caveats by extracting verbatim quotes first"],
    ],
  },
};

/* Facts & terms: question-style recall rows shown after each task statement's decision rows, covering its key
   facts, terms, summary points and the domain's comparison tables, so the decision table is a complete revision
   source ({ "1.1": [[question, answer], …] }). cheatsheets.ar.mjs must have the same rows in the same order. */
const recall = {
  1: {
    "1.1": [
      ["What is an agentic loop, and who runs the tools?", 'An app-driven cycle: request, run tools, return results, repeated while `stop_reason` is `"tool_use"`; Claude only asks, your code executes'],
      ["What is `stop_reason`?", "A field on every Messages API response saying why Claude stopped generating; the loop's only control signal"],
      ['What does `stop_reason` `"max_tokens"` mean?', "The response hit your `max_tokens` limit: exit the loop, then raise the limit or continue the response"],
      ['What does `stop_reason` `"pause_turn"` mean?', "A server-tool loop hit its iteration cap: send the assistant content back in a new request so it can carry on"],
      ['What does `stop_reason` `"refusal"` mean?', "Claude declined to respond: check `stop_details`, then retry using a fallback model"],
      ["How does the docs' example dispatcher handle `\"model_context_window_exceeded\"`?", "As its own `stop_reason` branch, handled as a context-limit case"],
      ["What fields does a `tool_use` block carry?", "`id`, `name` and an `input` that conforms to the tool's `input_schema`"],
      ["Where does a `tool_result` go, and how is it linked to its call?", "In a user-role message; its `tool_use_id` repeats the `id` of the `tool_use` it answers"],
      ["How do you report a failed tool back to Claude?", 'Return the error text as the `tool_result` content with `"is_error": true`, so Claude can explain it or retry'],
      ["What does an `error_max_turns` result lack?", "A `result` field: it's the result subtype for hitting the turn limit before the task finished"],
      ["Workflow vs agent: which is better?", "Neither is ranked: a workflow (predefined code paths) gives predictability for well-defined tasks; an agent (the LLM steers itself) gives flexibility"],
      ["What is one turn in the Agent SDK?", "One full cycle of Claude deciding what to do and the SDK running the tools it requested"],
    ],
    "1.2": [
      ["What is a hub-and-spoke coordinator?", "One coordinator splits the task, delegates pieces to subagents, merges the results and writes the final answer; only it sees the full picture"],
      ["Why route every delegation through the coordinator?", "One place to observe, uniform error checks and control over what each subagent sees; subagents calling each other lose all three"],
      ["What is a subagent (spoke)?", "An agent doing one delegated subtask in its own isolated conversation; it returns only its final message and never sees other spokes"],
      ["How does the coordinator decide when to call a subagent?", "Mainly from the subagent's `description`: a natural-language statement of when to use it"],
      ["What happens when a subagent reaches `maxTurns`?", "It stops and its output comes back flagged as partial; the coordinator resumes it, re-delegates the work or carries on without it"],
      ["How many more tokens did multi-agent setups use in Anthropic's testing?", "Roughly 3 to 10 times a single agent's on the same task; early research agents even spawned 50 subagents for simple queries"],
      ["What is a facet in a research decomposition?", "A distinct slice of the question (a subtopic, source set or source type) assigned to exactly one subagent"],
      ["What is a coverage failure?", "Gaps in the final output from scope nobody was assigned, not from poor work on the assigned parts"],
      ["What are Managed Agents, and what does a subagent follow-up keep?", "The Claude Platform's multi-agent orchestration in one session; each subagent has its own persistent session thread, so a follow-up keeps its earlier turns"],
    ],
    "1.3": [
      ["Context isolation: what does a new subagent see?", "Only its own system prompt (plus project context like CLAUDE.md) and the spawn prompt; never the coordinator's history or earlier spawns"],
      ["What is the spawn tool called?", "`Agent` in current SDKs, `Task` in older ones (match both); it starts a subagent of a chosen type with a per-run prompt"],
      ["Where are subagent types defined, and which fields are required?", "Under the `agents` option, each as an `AgentDefinition`: `description` and `prompt` required; `tools`, `disallowedTools`, `model`, `maxTurns` optional"],
      ["What do `disallowedTools` and `model` do in an `AgentDefinition`?", "`disallowedTools` removes tools from the agent's set; `model` overrides the model, e.g. `'sonnet'`, `'haiku'` or `'inherit'`"],
      ["Definition `prompt` vs delegation prompt?", "Definition `prompt`: the standing system prompt (role, expertise, constraints) for every run; delegation prompt: this run's task, the only channel for the coordinator's knowledge"],
      ["Which field in the spawn call names the chosen subagent?", "`subagent_type`, in the spawn `tool_use` input"],
      ["What is a structured finding record?", "The claim in one field; source URL, document name and location in separate fields, so the synthesis can cite every claim"],
      ["What is the general-purpose subagent?", "A built-in subagent Claude can invoke even though you never defined it"],
      ["Fork vs spawn: what context does each start with?", "A spawn starts empty except for its prompts; a fork starts with the full prior conversation, useful when every branch needs a long shared analysis"],
    ],
    "1.4": [
      ["With a code gate in place, should the prompt still state the order?", "Yes: the prompt helps the model plan the sequence; the gate decides allow or deny outside the model, so skipping is impossible"],
      ["How does a `PreToolUse` gate deny a call, or let it through?", 'Deny: `hookSpecificOutput.permissionDecision` `"deny"` with a `permissionDecisionReason`; let it proceed: return an empty `{}` (normal permission flow)'],
      ["What should the refund gate compare?", "The customer ID in the `tool_input` of `process_refund` against the ID `get_customer` actually returned, not a flag like `is_verified`"],
      ["When is a hook matcher (its tool-name pattern) read as exact names?", "Only letters, digits, `_`, `-`, spaces, commas and `|`; any other character makes it an unanchored JavaScript regex matching anywhere in the name"],
      ["What is the MCP tool name format?", "`mcp__server__action`; the server segment matches that server's key in `mcpServers`; gate money-moving tools by full names joined with `|`"],
      ["When does `SubagentStop` fire, and what is it for?", "As each subagent completes; the coordinator uses it to confirm all investigations finished and collect results before synthesis"],
      ["What is multi-concern decomposition?", "Splitting one customer message into separate problems, each investigated by its own subagent in parallel with the same case facts"],
      ["How do you reply to a message with several issues?", "One combined resolution once all findings are in; don't fix the first issue and ask for a second ticket"],
      ["Does a routing classifier enforce step order?", "No: it picks which tools are offered, not their order; ordering needs a prerequisite gate"],
    ],
    "1.5": [
      ["What is a hook, and why is it stronger than a prompt?", "Your code that the SDK runs at a fixed lifecycle point, always enforcing its decision; a prompt works only if the model obeys"],
      ["Hook or prompt: which rules go where?", "Hooks for rules that must never break (spending limits, protected files); the prompt for soft guidance like tone or which tool to try first"],
      ["`PreToolUse` vs `PostToolUse`: when does each fire?", "`PreToolUse`: after Claude emits `tool_use`, before the tool runs; `PostToolUse`: after a successful call, before Claude reads the result"],
      ["How are hooks registered in Python?", '`HookMatcher(matcher=..., hooks=[...])` under an event such as `"PreToolUse"`, plus a `timeout` in seconds'],
      ["What values can `permissionDecision` take in `PreToolUse`?", '`"allow"` (skips the permission prompt), `"deny"` (cancels, passing the reason to Claude), `"ask"` (prompts the user) or `"defer"` (pauses the turn)'],
      ['What happens when a hook returns `"defer"`?', "The turn ends with `stop_reason` `tool_deferred`, so the call can be resumed later"],
      ["How does a hook fix a call's arguments instead of blocking it?", 'Return `"allow"` with `updatedInput`, which rewrites the arguments before the call runs'],
      ["`additionalContext` vs `updatedToolOutput`?", "`additionalContext` appends information while Claude still sees the original output; `updatedToolOutput` replaces the output before Claude reads it"],
      ["Who sees a hook's `systemMessage`?", "Only the user; it never reaches Claude, so it can't redirect the agent"],
      ["Which hook fires when a tool call fails?", "`PostToolUseFailure`, for handling or logging errors; `PostToolUse` fires only on success and never sees them"],
      ["When does `PostToolBatch` fire?", "Once, after every call in a parallel batch resolves and before the next model call; TypeScript SDK only"],
      ["What does a normalizing `PostToolUse` hook typically convert?", "Unix (epoch) timestamps to ISO 8601 UTC and numeric status codes to labels, branching on `tool_name`, returned in `updatedToolOutput`"],
    ],
    "1.6": [
      ["What single question picks the decomposition pattern?", "Can you list the subtasks before the run? Yes: code chains or fans them out; no: an orchestrator derives them from findings"],
      ["Prompt chaining: who decides the subtasks, and when to use it?", "Your code, before the run; when each step needs the previous output and the order never changes, e.g. write copy, then translate"],
      ["What is a gate in a prompt chain?", "A programmatic check between steps that stops the chain if a step went wrong"],
      ["Parallelization (sectioning): who decides the subtasks, and when to use it?", "Your code, before the run; when subtasks are independent, e.g. one call screens content while another answers the query"],
      ["Orchestrator-workers: who decides the subtasks, and when to use it?", "An orchestrator LLM, at runtime; when needed subtasks vary with the input or findings, e.g. an unknown number of files or multi-source research"],
      ["When is little or no delegation right?", "A simple, single-output request: one call suffices, and extra agents would add complexity and latency without value"],
      ["What is attention dilution?", "Loss of retrieval precision and long-range reasoning as more content shares one context; per-file findings turn shallow and inconsistent"],
      ["Does requiring 2 of 3 review passes to agree fix dilution?", "No: voting suppresses real bugs and can't surface what every diluted pass misses; ranking files by risk in one pass doesn't help either"],
      ["How does a Claude Code workflow script guarantee each file its own pass?", "Code calls `agent()` once per file, e.g. `pipeline(found.files, file => agent(...))`; a prompt asking for care doesn't"],
      ["What stop rule do Claude Code's adaptive workflow examples use?", "Progress-based: stop once two consecutive rounds turn up nothing new"],
      ["What is path dependency?", "What to do next depends on what earlier steps found, so the route can't be scripted in advance"],
    ],
    "1.7": [
      ["What does a session store, and what does resume replay?", "The whole conversation, every tool call and result included; resume replays it as it was, so results mislead once files change"],
      ["How do you name a session, then resume it with a prompt?", '`claude -n <name>`, `/rename <name>` or Ctrl+R in the picker; then `claude -r "<name>" "<prompt>"` resumes and gives the next turn'],
      ["When is continue (`--continue`, `continue_conversation=True`, `continue: true`) right?", "Only one conversation at a time: it opens the newest session in the current directory, following recency, not identity"],
      ["When should you resume (`--resume <name>`, `resume=session_id`)?", "To re-enter one specific session by ID (or CLI name), act on finished analysis, or recover from turn or budget limits"],
      ["Can a fresh CI host resume a session from your laptop?", "Not unless the transcript is copied over: session files live on the local machine"],
      ["Headless CLI: how do you capture a `session_id` to resume?", "Use `--output-format json`, extract `session_id` (e.g. with `jq`) and pass it to `--resume`"],
      ["How do you fork in Python, TypeScript and the CLI?", "Resume with `fork_session=True`, `forkSession: true` or `--fork-session`; history copies to a new ID, original unchanged; store both IDs"],
      ["What does `up_to_message_id` do in standalone `fork_session()`?", "Forks the transcript only up to that message; the function returns the new ID without running the agent"],
      ["What does `persistSession: false` do?", "TypeScript-only option for stateless tasks: nothing is written to disk"],
      ["What is `ClaudeSDKClient` for?", "A Python option for a multi-turn chat within one process"],
      ["How do you recover from `error_max_turns` or `error_max_budget_usd`?", "Raise the limit and resume the same session; single-shot `query()` throws after that result, so catch it and keep the ID"],
      ["What values does `--resume` accept?", "A session ID, a name you set or a generated title; not a default display name like `my-app-3f`"],
      ["What goes in a structured summary seed for a fresh session?", "Conclusions, decisions and diffs, saved before ending; the detailed history isn't carried over; also how work moves to another host"],
    ],
  },
  2: {
    "2.1": [
      ["What does Claude weigh when choosing which tool to call?", "The tool's `name` and `description` against the request; array order, routing weights and internal IDs are invisible to it"],
      ["What is misrouting?", "Claude calling tool A when tool B was intended, most often because of overlapping names or descriptions"],
      ["What should a tool description cover, and how long should it be?", "At least 3-4 sentences (more if complex): what it does and returns, input formats, example queries, edge cases, when to use it over its look-alike"],
      ["Why not few-shot examples, a routing layer or merging to fix misrouting?", "Few-shot examples don't fix the descriptions; a routing layer is overkill and takes the choice from the model; merging is too big a first step"],
      ["When should several actions be consolidated into one tool?", "When they act on the same resource with a shared contract (create, review, merge a PR): one tool with an `action` parameter, reducing ambiguity"],
      ["What pattern must a tool `name` match?", "`^[a-zA-Z0-9_-]{1,128}$`: letters, digits, underscores and hyphens, 1 to 128 characters"],
      ["What happens if an `input_examples` entry doesn't fit `input_schema`?", "Each example is validated against `input_schema`; an invalid one returns a 400 error"],
      ["In what order does the API-built prompt place tools and the system prompt?", "Tool definitions, then your system prompt, then tool configuration; so a keyword rule in the system prompt can pull calls to one tool"],
      ["What output does the documented `get_orders` example spell out?", "`id`, `total` in USD, `status` (`pending`/`shipped`/`delivered`), `items` and ISO 8601 `created_at`: document what a tool returns"],
      ["Why do vague descriptions also hurt tool search?", "Tool search matches names and descriptions, so two vaguely described tools are harder both to find and to pick between"],
      ["Do specific names or service prefixes fix overlapping descriptions?", "They help as tool libraries grow (`search_customer_orders`, `github_list_prs`), but clear names with identical descriptions still overlap"],
    ],
    "2.2": [
      ["What does the agent decide from an `isError` result?", "Whether to retry, change its input, ask the user or stop, using the error text and metadata in that result"],
      ["Examples of an MCP protocol error?", "A JSON-RPC `error` for an unknown tool name (`-32602` in the lesson) or a request failing the `CallToolRequest` schema"],
      ["MCP `isError` vs Claude API `is_error`?", 'MCP: `"result": {"content": [...], "isError": true}`; Claude API: a `tool_result` block with `"is_error": true` and the error text in `content`'],
      ["Where can `errorCategory` and `isRetryable` go in an MCP result?", "In the `content` text or the optional `structuredContent` (shaped by the output schema); MCP itself defines only `isError`"],
      ["What are the four `errorCategory` values?", "`transient`, `validation`, `business` and `permission`; each tells the agent what has to change"],
      ["What does `isRetryable` tell the agent?", "Whether resending the identical request, unchanged, could ever succeed; false stops pointless retries"],
      ["What must change before each error category can succeed?", "Transient: nothing, the service recovers; validation: the arguments; business: the request or account state; permission: the credentials"],
      ["Business vs permission error?", "Business is about what was asked (legal hold, 10-attendee limit): explain and offer alternatives; permission is about who calls: broader access or escalate"],
      ["How does a subagent handle a transient error?", "Retries with backoff itself (timeout, rate limit, HTTP 500) and escalates to the coordinator only if retries run out"],
      ["What goes in a partial-failure report for a batch?", "Successful items as partial results, each failed item with its error and description, and what was attempted; never hide failures or fail the whole batch"],
      ["Why must a timed-out query never return an empty list?", 'The agent would claim nothing exists when nobody looked; `{"events": []}` is only for a query that ran and found nothing'],
    ],
    "2.3": [
      ["Synthesis agent fact checks: why not full web search or batching?", "Web search is too much power and blurs roles; batching leaves it waiting; `verify_fact` suits the simple 85% of checks"],
      ["What is a constrained tool?", "A workflow-specific tool that enforces its own limits, e.g. `load_document` accepting only valid document URLs instead of a generic `fetch_url`"],
      ["What does `tool_choice` control, and what are its values?", "Whether Claude must call a tool, set per request: `auto`, `any`, a named `tool`, or `none`"],
      ["What does `tool_choice` `auto` guarantee, and when is it the default?", "Nothing: Claude decides each turn and may answer in text; default when tools are provided; prompt wording steers but never guarantees a call"],
      ["When is `tool_choice` `none` the default, and what's its risk?", "Default when the request has no tools; no tool is called, so on a subagent it leaves the agent unable to act"],
      ["Example uses for `tool_choice` `any`?", "An SMS bot that must answer via `send_text_to_user`, or several extraction schemas fitting a document of unknown type"],
      ["Which setups reject `any` and forced tools?", 'Manual extended thinking (`thinking: {type: "enabled"}`), leaving `auto` or `none`; Mythos 5.1, Fable 5.1, Sonnet 5.5, Claude Opus 5.5 always return a 400'],
      ["Where does `disable_parallel_tool_use: true` go?", "Inside the `tool_choice` object, not at the request's top level; it governs parallel tool calls"],
      ["Subagent `tools` vs `disallowedTools`?", "`tools` lists exactly what it may call (omitted: all tools subagents can access); `disallowedTools` removes named tools or patterns like `mcp__github`"],
      ["How do you limit which subagents a coordinator can spawn?", "Put `Agent(worker, researcher)` in its `tools`; it can spawn only those named subagents"],
    ],
    "2.4": [
      ["Where in `~/.claude.json` do local and user servers live?", "Local: under this project's entry (you, this repo only); user: the top-level `mcpServers` key (you, every project)"],
      ["Does Claude Code read `~/.claude/mcp.json`?", "No, it's ignored without any error; Claude Code reads only `<project>/.mcp.json` and `~/.claude.json`"],
      ["Which MCP config fields support `${VAR}` expansion?", "`url`, `headers`, `command`, `args` and `env`, filled from each user's own environment"],
      ["What does a `headersHelper` command receive, and do its headers win?", "`CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL`; yes, its headers override same-name static headers"],
      ["Community vs custom MCP server?", "Connect the existing, often vendor-maintained server (Notion, Sentry, GitHub); build your own only for a workflow unique to your team"],
      ["How do you connect a vendor-hosted MCP server such as Notion?", "One line: `claude mcp add --transport http notion https://mcp.notion.com/mcp`"],
      ["What are the character caps for MCP tool descriptions?", "4,096 for server instructions and upfront tool descriptions; 16,384 for descriptions loaded through tool search"],
      ["A header-authenticated server returns 401 or 403: what happens?", "It's reported as a failed connection with no sign-in offered; fix the configured credential"],
      ["How is a scope conflict on one server name surfaced?", "Claude Code flags it in `claude mcp list` and `/mcp` when the name points at different endpoints"],
      ["Project and user servers are both configured: whose tools win?", "Neither: Claude Code loads every configured server's tools at once; scope decides who has a server, not whose tools win"],
      ["MCP resource vs MCP tool?", "A resource is a read-only catalog of what exists (issue summaries, docs tree, database schemas); a tool does the work"],
    ],
    "2.5": [
      ["What does 'locate before you load' mean?", "Find files with Grep or Glob, Read only what they point to, then Edit one exact spot; context stays small, edits precise"],
      ["Grep vs Glob?", "Grep searches file contents with a regex; Glob matches file paths by pattern and never opens files, so it can't tell what they contain"],
      ["What are Grep's `output_mode` values?", "`files_with_matches` (default) returns paths, `count` returns hits per file, `content` returns matching lines"],
      ["What are Grep's main inputs?", "`pattern` (regex), `path`, a `glob` filter, `output_mode`, `-i` and `multiline`"],
      ["What inputs does Glob take, and what does it return?", "A `pattern` such as `**/*.ts` and a `path`; it returns file paths only"],
      ["How do you size a change across many files before loading any?", "Grep with `files_with_matches` or `count`; you see the scope without pulling any file into context"],
      ["What inputs does Edit take?", "`file_path`, `old_string`, `new_string` and `replace_all`"],
      ["What must Edit's anchor, `old_string`, satisfy?", "Match exactly, whitespace and indentation included, and occur only once in the file"],
      ["What inputs does Write take, and what does it do?", "`file_path` and `content`; it replaces the entire file, so pass the whole content, never just the changed line"],
      ['Why prefer dedicated tools over `find . -name "*.py" | xargs grep "pattern"`?', "Structured inputs and output formatted for the model, and the read-only ones need no approval; shell commands do"],
      ["What is a wrapper (barrel) module, and how do you find all callers?", "A module re-exporting functions, maybe under aliases; list every exported name and Grep for each, plus the original name"],
      ["First file to read when exploring a repository?", "`CLAUDE.md` or `AGENTS.md`, for its documented architecture and conventions"],
    ],
  },
  3: {
    "3.1": [
      ["What decides who receives a CLAUDE.md (instruction scope)?", "Where it lives, not its wording: committed project files reach every clone; files under `~/.claude` stay with one user"],
      ["Who gets `~/.claude/CLAUDE.md` and `~/.claude/rules/`?", "Only you, in every project on your machine; never committed, so teammates and new hires don't get them"],
      ["Who can change project CLAUDE.md, and how far does it reach?", "Any developer can change or delete it; it reaches every teammate through source control, in that one repo only"],
      ["What is `./CLAUDE.local.md` for?", "Your personal instructions for one project (e.g. sandbox URLs), added to `.gitignore`; a stale copy can explain odd behaviour"],
      ["Where does the managed policy CLAUDE.md live?", "macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux and WSL `/etc/claude-code/CLAUDE.md`; Windows `C:\\Program Files\\ClaudeCode\\CLAUDE.md`"],
      ["What can `managed-settings.json` do?", "Enforce settings that personal settings and `--settings` can't override (few exceptions); carry instructions in `claudeMd`, block tools with `permissions.deny`, enable sandboxing"],
      ["Do CLAUDE.md levels override each other?", "No: all loaded levels sit in context together; Claude reconciles conflicts by judgment, not precedence, so remove contradictions"],
      ["Recommended maximum size for each CLAUDE.md?", "About 200 lines; larger files use more context and are followed less reliably"],
      ["Where is auto memory stored, and does a fresh clone get it?", "`~/.claude/projects/<project>/memory/`: Claude's personal notes for its own use, never committed, so a fresh clone doesn't get them"],
      ["What does an `@path` import in CLAUDE.md do?", "Loads that file at launch with the importing file, so a package's CLAUDE.md can pull in just the standards it needs"],
      ["How do you import a file from your home directory?", "With `@~/...`, e.g. `@~/.claude/my-project-instructions.md`, keeping private notes out of git; imports from outside the working directory need approval"],
      ["Making sure AGENTS.md instructions load in Claude Code?", "Import `@AGENTS.md` in CLAUDE.md, then add notes meant only for Claude; just asking Claude to read it is less reliable"],
      ["What does `/compact` do, and what reloads after it?", "Summarizes the conversation to free context; the project's root CLAUDE.md reloads from disk, nested files only when needed"],
      ["When does a mid-session CLAUDE.md edit take effect?", "It isn't re-read each turn: after `/compact`, after opening it via `/memory`, or in a new session"],
    ],
    "3.2": [
      ["Command file vs skill: what's the difference?", "A command is one Markdown file; a skill is a folder with `SKILL.md` that can also hold docs, examples and scripts; both become slash commands"],
      ["What part of a skill loads every session?", "Only its description; the full body loads when invoked or judged relevant, so it's the wrong home for always-on rules like security"],
      ["How are command and skill names derived?", "A command takes its filename, each subfolder adding a `:` prefix (`/frontend:component`); a skill takes its folder name unless `name` sets it"],
      ["Where does a personal skill load?", "`~/.claude/skills/<name>/SKILL.md` loads in all your local projects, but not in Cowork or cloud sessions"],
      ["Where do enterprise skills live?", "`.claude/skills/<skill-name>/SKILL.md` inside the managed settings directory, available to all users where the organization deploys it"],
      ["How are a plugin's skills named?", "Namespaced as `/plugin-name:skill-name`, so they never collide with other skills"],
      ["How does a skill read the arguments typed after it?", "`$ARGUMENTS` for all input, `$ARGUMENTS[0]` or `$0` by position; `arguments: [issue, branch]` exposes `$issue` and `$branch`"],
      ["Does `argument-hint` validate or require arguments?", "No: it's only an autocomplete hint, and Claude Code only; uploads accept just `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`"],
      ["How long does `allowed-tools` pre-approval last in current Claude Code?", "Only the turn that invokes the skill; it lapses at your next message, and unlisted tools stay available but prompt"],
      ["What does `disallowed-tools` do?", "Removes the listed tools from Claude's pool while the skill is active; it pre-approves nothing"],
      ["What does a `context: fork` skill return to the main conversation?", "Only a summary; the skill body is the subagent's prompt, and who may invoke the skill is unchanged"],
      ["How do you set up a forked skill's subagent?", "`agent` picks its type (e.g. `Explore`), `model` its model; forked runs go to the background unless `background: false`"],
      ["Can a custom skill take a bundled command's name?", "The primary name yes (e.g. `/code-review`), an alias never, such as `/review` (for `/code-review`) or `/reset` and `/new` (for `/clear`)"],
    ],
    "3.3": [
      ["What is a path-scoped rule?", "A `.claude/rules/` file with `paths` globs in its frontmatter; it costs no context until Claude works on a matching file, then loads itself"],
      ["How is `paths` written in a rule file?", "A YAML list or comma-separated string of globs between `---` lines at the top; the rule loads if any pattern matches"],
      ["What does a `.claude/rules/` file without `paths` do?", "Loads every session like CLAUDE.md and is re-injected after compaction; it organizes always-on topics but doesn't cut context"],
      ["Where are `paths` globs matched from?", "The repository root, unless they start with `**/`: `api/**/*.ts` means a top-level `api/`, not `src/api/`"],
      ["What do `*.md` and `**/*.ts` match?", "`*.md`: Markdown files in the project root only; `**/*.ts`: TypeScript files in any directory"],
      ["How do you match two file extensions in one glob?", "Braces: `src/**/*.{ts,tsx}` matches every `.ts` or `.tsx` file under `src/`, however deeply nested"],
      ["What does `**/*.test.tsx` reach?", "Component tests at any depth: beside components, in `__tests__` folders and in a root `tests/` folder"],
      ["When does a `paths` rule come back after `/compact`?", "Only when Claude next works on a matching file; the root CLAUDE.md and unscoped rules reload right away"],
      ["Path-scoped rule vs directory CLAUDE.md?", "A directory CLAUDE.md covers its own folder and is versioned with its code; one rule's glob can cover files scattered anywhere"],
      ["Why not copy conventions into many folder CLAUDE.md files?", "Every new folder needs a copy, the copies drift, and contradictory copies make Claude pick one arbitrarily"],
      ["Why not a skill or root CLAUDE.md sections for file-type conventions?", "A skill isn't automatic (someone invokes it or Claude decides to); per-type sections in one root file leave Claude guessing which applies"],
    ],
    "3.4": [
      ["What does plan mode separate, and what can Claude do in it?", "Deciding how code should change from changing it: Claude reads, searches and proposes a plan, but edits nothing until you approve"],
      ["What is a permission mode, and which ones exist?", "The session setting for what runs without asking: `default`, `plan`, `acceptEdits`, `dontAsk`, `auto`, `bypassPermissions`"],
      ["How do you enter plan mode?", "`claude --permission-mode plan` at launch, Shift+Tab mid-session in the CLI, or the mode selector in VS Code and Desktop"],
      ["Which signs call for plan mode from the start?", "A large change, several workable approaches, architectural impact or many files that must match (e.g. a 45+ file migration); don't 'switch if it gets complicated'"],
      ["How do you set up a direct-execution task?", "Put the file, scenario, expected result and reproduction command in the prompt, then run in `default` or `acceptEdits`"],
      ["What does `default` mode run without asking, and when to use it?", "Reads only; for sensitive work where you review every action"],
      ["What does `acceptEdits` run without asking, and when to use it?", "Reads, file edits and `mkdir`, `touch`, `mv`, `cp`; for iterating on code you review or headless edit-only jobs like lint fixes"],
      ["`auto` vs `bypassPermissions`?", "Both run everything: `auto` with a classifier's background safety checks, for long tasks with prompt fatigue; `bypassPermissions` unchecked, isolated containers and VMs only"],
      ["Can commands run in plan mode without a prompt?", "Yes, if auto mode is available and its classifier approves them; reads pass too, but edits always wait for plan approval"],
      ["Which prompts still appear in every permission mode?", "Explicit ask rules, and Bash reads outside the working directories when `permissions.blockReadsOutsideWorkingDirectories` is on, even under `auto` or `bypassPermissions`"],
      ["Explore vs Plan subagent?", "Both built-in and read-only; Explore (Write and Edit denied) searches in its own context and returns a summary; Plan researches the codebase for planning"],
      ["What does `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS=1` do?", "Removes the built-in Explore and Plan subagents, so exploration runs in the main conversation and context use can rise sharply"],
    ],
    "3.5": [
      ["What makes each round of iterative refinement improve?", "A concrete, checkable target (sample outputs, a failing test, an answered question), not a description Claude must interpret; vague corrections just cause new guesses"],
      ["Input/output examples: how many, and how to choose them?", "Real inputs with exact expected outputs: start with one, add a second or third only if output still mismatches, each a different edge case"],
      ["What is test-driven iteration?", "Write tests first, covering expected behaviour, edge cases and performance; Claude implements, runs them and fixes failures until all pass"],
      ["What do you send back after a failing test run?", "The assertion, expected and actual values and the traceback, not 'the tests are failing'"],
      ["How does the interview pattern work?", "Before any code, Claude questions you (e.g. via `AskUserQuestion`) to surface things like cache invalidation or failure modes, then writes a spec such as `SPEC.md`"],
      ["Interview vs examples and tests: which when?", "Interview when requirements are unknown; examples and tests when they're known but not yet checkable; the interview's spec often becomes the tests"],
      ["What makes failures interacting rather than independent?", "A shared cause, one being downstream of another, or fixes touching the same code; failures in unrelated code with separate fixes are independent"],
    ],
    "3.6": [
      ["What must a headless `claude -p` run get up front?", "Everything: prompt, tool approvals, output format and any extra context, since nobody can respond during the run"],
      ["Why does plain `claude` hang a CI step?", "It opens an interactive session that waits for input; use `-p`, since `CLAUDE_HEADLESS=true` and `--batch` don't exist and `/dev/null` stdin doesn't help"],
      ["Can `claude -p` take piped input?", "Yes, it reads stdin: pipe in logs or diffs and redirect the printed result to a file"],
      ["How do you narrow `--allowedTools` to specific commands?", "Entries like `Bash(git diff *)` or `Bash(git commit *)`; every other shell command stays unapproved"],
      ["What still runs under `--permission-mode dontAsk`?", "Working-directory reads, read-only commands and `--allowedTools` matches; anything else that would prompt is refused, so pair it with a narrow list"],
      ["What are the `--output-format` values?", "`text` (default, plain), `json` (one object: `.result` text, session ID, metadata), `stream-json` (newline-delimited, streams in real time)"],
      ["What does the `prompt` input do in `anthropics/claude-code-action@v1`?", "Enables automation mode: the Action runs on its own instead of waiting for an `@claude` mention, as a review on every PR needs"],
      ["How do you pass CLI flags to the Claude Code GitHub Action?", "Through the `claude_args` input, e.g. `--allowedTools`, `--max-turns` and `--model`"],
      ["How do you bound an unattended CI run?", "`--max-turns` in `claude_args`, plus workflow timeouts and GitHub concurrency controls on parallel runs"],
      ["Which session should review the code in CI?", "A separate session; the one that wrote the code still holds its reasoning"],
      ["What should CLAUDE.md give CI test generation?", "Testing standards, fixture conventions and review criteria; noting what makes a test valuable and which fixtures exist cuts low-value tests"],
    ],
  },
  4: {
    "4.1": [
      ["Why don't 'be conservative' or 'high-confidence only' cut false positives?", "The model was already confident in them: they come from its different idea of what counts as an issue; caution only lowers recall"],
      ["What are a false positive and precision?", "False positive: a reported finding that isn't a real problem; precision: the share of reported findings that are real"],
      ["What are recall and F1?", "Recall: the share of real issues in a known-answer set the reviewer reports; F1: one score balancing precision and recall"],
      ["How do you make 'check that comments are accurate' testable?", "Flag a comment only when the code contradicts the behavior it describes; typos, stale wording and brevity are out of scope"],
      ["What is a skip list, and what belongs on it?", "Never-report categories the model can spot, e.g. generated files or whatever CI already checks; also how you pause a noisy category"],
      ["What is `REVIEW.md` for?", "Tailoring Anthropic's Code Review: which issues get flagged, how severe and how reported, e.g. `## Do not report` and `## Always check` sections"],
      ["What is a severity anchor?", "A concrete code example tied to a severity level so labels stay consistent; vary anchors, or 'critical' may come to mean auth"],
      ["What are Code Review's severity levels?", "`Important`: fix before merging; `Nit`: minor, non-blocking (new `CLAUDE.md` violations land here); `Pre-existing`: a defect that predates this PR"],
      ["What does Code Review report by default?", "Correctness bugs that would break production; formatting preferences and test-coverage gaps are excluded"],
      ["What does Code Review's 'feedback count' metric show?", "Comments auto-resolved after a developer fixed the flagged issue; a rough live signal that misses ignored or missed findings"],
    ],
    "4.2": [
      ["What is few-shot prompting?", "A few worked input-output examples in the prompt; the model copies their format and infers the judgment behind them"],
      ["When do few-shot examples pay off most?", "Format easier to show than explain, subtle conventions, or instructions alone gave inconsistent output; start with one, add more if needed"],
      ["What makes a good few-shot example set?", "Relevant to real inputs, diverse, each in `<example>` tags inside `<examples>` (so not read as instructions), and few: 2 to 4"],
      ["Why should each example state its reasoning?", "Input, reasoning and output let the model generalize to new cases; a bare input-output pair teaches only that input"],
      ["Canonical examples vs a laundry list?", "A few diverse, representative examples that convey the rule vs an exhaustive edge-case list the model pattern-matches instead of generalizing from"],
      ["What is a contrast pair?", "Two look-alike examples differing only on the deciding factor, one acceptable and one an issue; it cuts false positives"],
      ["What is an unintended pattern in few-shot examples?", "An accidental trait all examples share, such as length or language, that the model wrongly treats as a signal"],
      ["Explicit criteria or few-shot examples: which to add?", "Rule never spelled out: criteria (4.1); spelled out but applied unevenly: examples; tools confused by weak descriptions: fix the descriptions"],
      ["What are tool use examples (`input_examples`)?", "Sample calls in a tool definition showing usage the schema can't convey; add them where usage isn't obvious, skip simple single-parameter tools"],
      ["What gain did Anthropic report from tool use examples?", "Accuracy on complex parameter handling rose from 72% to 90%, by teaching formats, ID patterns and optional-field combinations"],
    ],
    "4.3": [
      ["What is an extraction tool, and where is its result?", "A tool you never run: its `input_schema` defines the record; `stop_reason` is `tool_use`, and that block's `input` is your data"],
      ["What does `strict: true` add to a tool schema?", "Without it the schema only steers (wrong types, missing keys); with it inputs always match, the name is valid, no undeclared keys (`additionalProperties: false`)"],
      ["What's a syntax error vs a semantic error?", "Syntax: malformed JSON, wrong type, missing required key, undeclared property (strict mode prevents these); semantic: valid structure, wrong about the source"],
      ["What is `output_config.format` (JSON outputs)?", "The same constrained decoding with no tool call: schema-valid JSON comes back in a text block"],
      ["What do `tool_choice` `auto` and `none` do?", "`auto`: Claude decides whether and which tool, text first allowed, no guarantee; `none`: tools disabled for the turn, text only"],
      ["What do `tool_choice` `any` and a forced tool guarantee?", "`any`: some tool is called, Claude picks which; forced by name: that exact tool. Neither emits text before the `tool_use` block"],
      ["Which models reject `any` and forced `tool` with a 400 error?", "Sonnet 5.5, Opus 5.5, Mythos 5.1 and Fable 5.1: use `auto` + strict + the tool named in the prompt; the exam still expects forcing"],
      ["What are nullable fields and escape values for?", "Nullable: 'not in the document' is an explicit, visible answer; escape values like `other` or `unclear` give a valid choice when no category fits"],
      ["The source mixes date formats: where does the conversion rule go?", "In the system prompt or the field description (e.g. convert to YYYY-MM-DD), optionally with `input_examples`; keep the schema strict"],
    ],
    "4.4": [
      ["Why must a retry resend the document and the failed output?", "It's often a fresh request that remembers nothing: the document to verify against, the failed output to keep what was right"],
      ["What should each validation error in a retry say?", "A specific fact naming the field and the problem, e.g. '`stated_total` is 980, but line items add up to 940', never 'invalid, try again'"],
      ["What are self-correction fields?", "Extra outputs like `stated_total` (as printed) and `calculated_total` (the model's own line-item sum) for your code to compare; no second model needed"],
      ["`stated_total` and `calculated_total` disagree: retry?", "Yes if `conflict_detected` is false (an extraction error); if true, the document contradicts itself: human review with the conflict flagged"],
      ["Which extraction failures can retry with feedback fix?", "A value in the wrong object, mis-summed line items, format mismatches: the right answer is in the source and the error points to it"],
      ["What does `is_error: true` on a `tool_result` do?", "Tells Claude the call failed, so it reads the error and fixes its next attempt; extraction retries feed errors back the same way"],
      ["The Agent SDK runs out of structured-output retries: what comes back?", "The result subtype `error_max_structured_output_retries`, which your code must handle; make possibly missing fields optional or nullable"],
      ["What is the validation layer?", "Your post-extraction code enforcing every rule the schema can't express; SDK helpers do this, stripping constraints like `minimum` and checking them afterwards"],
      ["What is a generate-and-evaluate loop?", "Output checked against clear criteria, with feedback driving the next attempt; cap attempts, since a repeat failure usually means a different problem"],
      ["What is dismissal analysis?", "Grouping dismissed findings by `detected_pattern` to get dismissal rates per construct, then fixing the prompt criterion for the worst one"],
    ],
    "4.5": [
      ["What is a Message Batch?", "Independent Messages API requests processed asynchronously at 50% off: create, poll status, download results; can mix prompts, multi-turn histories and images"],
      ["Synchronous or batch: what's the deciding question?", "Is anything blocked waiting? Merge gates and user chat replies stay synchronous; nightly test generation and weekly audits batch. Decide per workflow"],
      ["Does the batch discount stack with prompt caching?", "Yes: 50% off all usage (input, output and special tokens), and prompt caching discounts apply on top"],
      ["How do you know a batch has finished?", "`processing_status` moves from `in_progress` to `ended` (all done, or 24 hours passed and the rest expired); then download the `.jsonl` results"],
      ["What are the batch result types, and which are billed?", "`succeeded`, `errored`, `canceled` and `expired`; only `succeeded` is billed"],
      ["What happens when a batch exceeds its size limits?", "`413 request_too_large`; split it. Smaller batches help even under the caps, since a failure leaves less to redo"],
      ["Which Messages parameters are rejected inside a batch?", "`stream: true`, `speed` and `max_tokens: 0`, with a validation error"],
      ["What does a batch `400 invalid_request_error` ('prompt is too long') mean?", "The input exceeds the context window and fails every time unless split (derived IDs); the token counting API catches it beforehand"],
      ["When does resubmitting a failed request unchanged help?", "Only transient ones, such as expiry or internal server errors; submitted batches can't be edited, so others go in a new batch with a fix"],
      ["Can batch requests use tools?", "No client-side tool loop (single-shot requests); tool definitions, prior turns and server tools like web search work; `pause_turn` needs a new request"],
      ["How often should you submit batches to meet an SLA?", "Worst case is interval plus 24 hours, so keep the interval within SLA minus 24: 48-hour SLA nightly, 30-hour SLA about every 4 hours"],
      ["What should you do before batching tens of thousands of requests?", "Dry-run the request shape on the synchronous API, then tune the prompt on a representative sample; wrong but successful answers are still billed"],
    ],
    "4.6": [
      ["Why does the writing session review its own code badly?", "It still holds its plan, scoped-out edge cases and shortcuts; self-review instructions or more extended thinking only add reasoning on top"],
      ["What is the Writer/Reviewer split?", "Session A implements, Session B (which never saw the work) reviews with a concrete brief, then A addresses the feedback"],
      ["Is a fresh subagent given only the diff and plan independent?", "Yes: it sees only what it's handed, e.g. a review subagent checking the diff against `PLAN.md`"],
      ["What makes the Managed Agents Outcomes grader independent?", "Only its fresh context: it's created new and shares the writer's model and tools"],
      ["What does a fresh reviewer do without explicit criteria?", "Tends to approve everything; name what to verify: requirements implemented, edge cases tested, nothing out of scope changed"],
      ["What are the attention budget and sectioning?", "Every token depletes a context's finite attention; sectioning gives each consideration its own LLM call to keep attention focused"],
      ["Per-file pass vs integration pass: what does each catch?", "Per-file: local bugs (missing null check, off-by-one) with full attention, blind across files; integration: data flow between files that share data"],
      ["How do you run per-file passes over hundreds of files?", "A scripted headless `claude -p` call per file (fresh context each), with `--allowedTools` / `--permission-mode dontAsk`; then the integration passes"],
      ["How does Claude Code's Code Review pipeline work?", "Parallel agents analyze the diff, a verification step checks findings against the code, then findings are deduplicated, sorted by severity and posted inline"],
      ["Can self-reported confidence alone trigger escalation?", "No: on hard cases the model is often sure and wrong; once calibrated on a labeled set, use it only to prioritize human review"],
    ],
  },
  5: {
    "5.1": [
      ["What is context rot?", "Accuracy and recall over the context fall as tokens grow; what goes in, in what format and where matters more than window size"],
      ["What is progressive summarization, and its risk?", "Repeatedly condensing older turns and earlier summaries into a running summary; each pass loses precision, so an exact amount and deadline become 'a refund soon'"],
      ["What does a case-facts block hold, and how with several issues?", "Exact order numbers, amounts, dates, statuses and deadlines the customer gave; one structured record per issue with its ID, value, status and timestamps"],
      ["What is the SDK summary prompt's 'Context to Preserve' section?", "Its final section, asking for domain details and promises made to the user; a case-facts block still takes those facts out of summarization entirely"],
      ["How do you trim output from a tool you don't own?", "Intercept it with a `PostToolUse` hook and keep only the fields the task needs before it enters context"],
      ["What does `clear_tool_uses_20250919` do?", "Server-side context editing for stale results: past a threshold, the oldest tool results become placeholders before Claude sees them; the client keeps full history"],
      ["How does the lesson's example request turn on context editing?", 'Beta `context-management-2025-06-27` in `betas` and `context_management={"edits": [{"type": "clear_tool_uses_20250919"}]}`; the example uses `web_search_20250305`'],
      ["What is the lost-in-the-middle effect?", "Facts mid-input are used less than those at the start or end; a 2023 study saw accuracy fall over 30%"],
      ["What is structured note-taking?", "The agent persists notes outside the context window and pulls them back in when needed"],
      ["What should a subagent's returned findings carry, and how much?", "Distilled facts and citations, often 1,000 to 2,000 tokens, each with source location, date and methodology; very large output is stored, returning a reference"],
    ],
    "5.2": [
      ["What is an escalation trigger, and which three exist?", "An observable condition that sends a case to a human: an explicit request for a person, policy silent or ambiguous, or no meaningful progress"],
      ["What only looks like an escalation trigger?", "Anger or negative sentiment, case complexity, and the model's self-rated confidence, which was never checked against real accuracy"],
      ["What does the agent do when reasonable attempts make no progress?", "Escalates, handing off with a summary of the attempts made so far"],
      ["What does escalation accuracy measure?", "Both errors: missed escalations and unnecessary handoffs, judged by whether each case really needed a human"],
      ["What is a policy gap?", "A request written policy neither permits nor forbids; refusing invents a prohibition, approving invents a permission, so only someone with authority decides"],
      ["What is a reiterated preference?", "The customer repeats wanting a person after being offered help; it counts as an explicit request, so hand off without pushback"],
      ["What is heuristic selection among lookup matches, and why avoid it?", "Picking the most recent, most complete or first record; it fails silently and risks exposing or altering another person's data"],
      ["What is a contrasting example pair?", "Two few-shot examples that differ in one feature only, so the model learns exactly where the escalation boundary lies"],
      ["What is `TASK_SPECIFIC_INSTRUCTIONS` in Anthropic's customer support guide?", "The system prompt string joined from sections such as `STATIC_GREETINGS_AND_GENERAL`, `EXAMPLES` and `ADDITIONAL_GUARDRAILS`"],
      ["Where do escalation criteria go in the support guide's system prompt?", "In `ADDITIONAL_GUARDRAILS`, each rule with its reason; the guide's own guardrail bans promises or agreements the agent isn't authorized to make"],
      ["How should sentiment be used, if not for routing?", "As an outcome measure: the customer's sentiment should be better at the end of the conversation than at the start"],
    ],
    "5.3": [
      ["What is structured error propagation?", "Subagents fix transient failures locally and pass the rest up with type, attempts, partial results and alternatives, so the coordinator chooses a recovery"],
      ["What is context isolation, and why does it matter for errors?", "Each subagent works in its own context and only its final message reaches the coordinator, so unreported failures stay invisible"],
      ["How should a single failed tool call be returned?", "As a `tool_result` naming the cause, with `is_error: true`, instead of crashing"],
      ["How are `server_error` and `unknown` failures handled?", "Retry locally a capped number of times, then escalate with full context; `server_error` often resolves on its own"],
      ["How many corrected retries after an invalid tool request?", "2-3 retries with corrections, then give up; retries need a cap and must suit the failure type"],
      ["Access failure vs valid empty result?", "Access failure: the query never finished and reveals nothing; an error. Valid empty result: it ran and matched nothing; a finding (success, zero items)"],
      ["Why is a timeout the most ambiguous access failure?", "The server might still have executed the request, even though no result came back"],
      ["What is silent suppression, and why can't it be caught downstream?", "A failure returned as an empty list marked success; the coordinator claims coverage nobody performed, and only the subagent saw the difference"],
      ["What is the termination anti-pattern?", "Stopping the whole workflow because one source failed; it discards the other subagents' valid results, and restarts are expensive"],
      ["What does a coverage annotation record?", "Support per finding (several independent sources, one source, or partial results) and gaps per topic: which source, why, and what was tried"],
      ["What can the coordinator do with a full error report?", "Retry with a changed query or the suggested alternative, reassign the gap to another source, or keep partial results and record the gap"],
    ],
    "5.4": [
      ["What is the attention budget?", "Every token in context competes for attention, so the fuller the window, the worse the recall; keep the rest in subagents or on disk"],
      ["`/compact` vs `/clear`?", "`/compact` summarizes the chat to continue the same work (focus it, e.g. `/compact focus on the refund flow trace`); `/clear` wipes context for unrelated work"],
      ["What is `compact_boundary`?", "The system event subtype recorded when compaction runs; its `compactMetadata` holds `trigger` (e.g. `auto`) and `preTokens`"],
      ["What does Claude Code reload after compaction?", "Project-root CLAUDE.md and unscoped rules from disk, plus up to five recently modified files it read or edited; your scratchpad isn't auto re-read"],
      ["How do you set standing rules for what compaction must keep?", "Write them in CLAUDE.md, which is re-injected from disk after compaction"],
      ["What is the Explore subagent?", "Claude Code's built-in subagent for file discovery, code search and codebase exploration; it gets read-only tools only, with Write and Edit denied"],
      ["What is a scratchpad file?", "A file on disk, such as a custom agent's `NOTES.md`, where exact findings are written as learned and read back across context boundaries"],
      ["What is `claude-progress.txt`?", "A progress log an initializer creates in long-running agent harnesses, next to a JSON feature list whose entries carry a `passes` flag"],
      ["Why keep run state in a JSON manifest, not Markdown?", "A model is less prone to wrongly altering or overwriting JSON than Markdown"],
      ["When should you not delegate to a subagent?", "Quick targeted changes, frequent back-and-forth and latency-sensitive work: a non-fork subagent starts with only its prompt and must gather context first"],
      ["What is a phase summary?", "A condensed account of what the previous phase established, placed at the top of every next-phase prompt to avoid costly rediscovery"],
      ["What makes a good task to delegate to a subagent?", "A specific question whose answer compresses well, such as all test file paths as one list or a flow's call chain"],
    ],
    "5.5": [
      ["When is a confidence score fit for routing?", "Only once labeled data shows it matches real accuracy in every document type and field, e.g. 0.9 is right about 90% of the time"],
      ["What is aggregate accuracy, and what can it hide?", "One weighted average across documents and fields, driven by common ones; it can hide a weak document type or a rare, costly field like dosage"],
      ["What is a segment?", "A slice of output: one document type, one field, or a type-and-field combination such as dosage on handwritten prescriptions"],
      ["How does calibration work?", "Run the pipeline on a labeled set kept out of prompt tuning, bucket fields by score, check each bucket's real accuracy, set thresholds from it"],
      ["What is stratified random sampling?", "Sampling separately within each segment, so rare, risky segments are represented and get their own error estimate in ongoing audits"],
      ["What does a confusion matrix show?", "Which categories a classifier confuses with which, errors a single accuracy figure hides; Anthropic's classification cookbook builds one"],
      ["How do you guarantee a confidence score on every field?", "With structured outputs, make confidence a required schema property on each field; score per field, not per document"],
      ["What shows raw self-reported scores aren't probabilities?", "A cookbook example gave one text 0.7 for Technology and 0.5 for Business, over 1 in total; raw scores rank items but aren't calibrated"],
      ["When must confidence thresholds be recalibrated?", "Whenever the prompt, the model or the document mix changes"],
      ["When does a field go to a human regardless of its score?", "When its source is problematic: self-contradicting, documents disagreeing, illegible or missing; let the model flag conflicts or say it doesn't know"],
      ["Why is confidence fine for review routing but not escalation?", "Here it's per field, calibrated and only prioritizes review; it never decides escalation on its own"],
      ["How should the human review queue be ordered?", "Likeliest-wrong and costliest items first (high value, regulated, legally significant); watch for sudden spikes in one field's review rate"],
    ],
    "5.6": [
      ["What is provenance?", "The link between a claim and the specific passage that supports it"],
      ["What is an output contract, and how is it enforced?", "The format the lead agent requires from subagents (claim, source, excerpt), enforced with structured outputs so no claim can miss its `source`"],
      ["What does Anthropic's CitationAgent do?", "A separate agent in the research system that ties the synthesized report's claims back to specific document locations"],
      ["What goes in a synthesis report's contested section?", "Disputed or single-source findings with their conflicts annotated; consistently supported findings go in the established section"],
      ["How should the final report present each content type?", "Financial data as tables, news as prose, technical findings as structured lists"],
      ["What does a `char_location` citation carry?", "For plain-text documents: `cited_text`, `document_index`, `document_title`, `start_char_index` (0-indexed) and `end_char_index` (exclusive)"],
      ["How does `cited_text` count toward tokens?", "Not toward output tokens, nor input tokens when passed back later, so cost is a weak reason to strip citations"],
      ["What fields does a `search_result` block need?", "Required `source`, `title` and `content`, optional `citations` with `enabled`; `source` can be any stable ID, e.g. `kb://article-1234`"],
      ["Where does document metadata go?", "In the `context` field (text or stringified JSON) when sent with citations; in prompts, a `<source>` tag per document with metadata subtags like dates"],
      ["How are plain-text, PDF and custom content documents cited?", "Plain text and PDF are chunked by sentence and cited by character indices (0-indexed) or page numbers (1-indexed); custom content by block indices (0-indexed)"],
      ["When do you use a custom content document?", "For lists, transcripts, special formatting or more granular citations; it keeps its block structure, with no extra chunking"],
      ["Why not average, keep the most authoritative or only the newest figure?", "An average appears in no source, so can't be cited; picking one drops credible data, settling an open question; newest-only discards a possible trend point"],
      ["Who reconciles conflicting figures, and how?", "The coordinator, with the wider view: it checks definitions or periods (such as different fiscal years) and passes both values on if they truly disagree"],
      ["Why a source date on each figure, not a run timestamp?", "Figures contradict only if they describe the same moment; source dates let the coordinator tell trends from true conflicts, run timestamps can't"],
    ],
  },
};

export const SHEETS = {
  1: { sub: "Loops, coordinators, subagents, hooks, decomposition and sessions.", cards: d1, decide: decide[1], recall: recall[1] },
  2: { sub: "Tool descriptions, structured errors, tool scoping, MCP servers and built-in tools.", cards: d2, decide: decide[2], recall: recall[2] },
  3: { sub: "Configure Claude Code for productive, consistent and scalable development workflows.", cards: d3, decide: decide[3], recall: recall[3] },
  4: { sub: "Make Claude's output accurate, consistent, machine-readable and production-ready.", cards: d4, decide: decide[4], recall: recall[4] },
  5: { sub: "Keep the right information, handle uncertainty and build reliable agents.", cards: d5, decide: decide[5], recall: recall[5] },
};
