# Authoring guide

How to add sections, diagrams and exercises so they match the rest of the guide.

## Quick start

```bash
npm install
npm run dev                                   # live preview; content errors appear in the terminal
npx kernel new chapter <program> <name>       # starts from a template that already validates
npx kernel new section <program> <chapter> <name> [--kind lesson|lab|quiz|summary]
npx kernel new lab <program> <name> --page chNN/slug
npx kernel validate                           # every error, with file and line
```

In VS Code, install the recommended extensions (YAML, Markdoc, Prettier). The committed `.vscode` settings check the YAML files against the content schemas, and typing `kp-` in a page offers a snippet for each tag. Outside this repository, the schemas are published beside the site at `https://<site>/schema/v1/` (for example `source/program.schema.json`), so any editor with JSON Schema support can use them. The full list of tags, with every attribute, is the generated [component catalog](CATALOG.md).

## 1. How content is organised

The `content/` folder is the single source of truth. It holds only data: Markdoc pages (`.md`), YAML and JSON. The compiler (`packages/compiler`, run as `kernel validate` or `kernel build`) checks it against the content contract and builds the navigation, so you never edit JavaScript to add material. `npm run dev` recompiles it on every change.

```
content/
  site.yml                         site name, tagline, repository, program order
  site/home.md                     the site home page
  interface.json                   interface text shared by every program
  programs/rhel9-ansible/
    program.yml                    id, title, platform, stages, variants, reader variables
    objectives.yml                 skills mapped to lessons, practice and labs
    details.md                     platform page: explanations, diagrams
    details.data.yml               data for that page's tags
    legacy.yml, home.json, progress.json
                                   optional landing page and dashboard copy (built-in pages are used without them)
    chapters/
      ch03-implementing-playbooks/
        _chapter.yml               title, goal, objectives
        01-inventory.md            section 3.1
        01-inventory.data.yml      quiz questions, widget copy and other data for 3.1
        02-lab-inventory.md        section 3.2
      ch04-managing-variables-and-facts/
        _chapter.yml               status: planned + topics → shown as "coming soon"
```

- **Order** comes from the numeric filename prefix (`01-`, `02-`…).
- **URL slug** is the filename without its prefix: `03-configuration.md` → `#/rhel9-ansible/ch03/configuration` (links inside content leave out the program: write `#/ch03/configuration`, and the site adds the current program). Renaming a file changes its URL and resets anyone's progress for that page, so avoid renaming published sections.
- **Section links** add the heading's id after a second `#`: `#/ch08/collections#where-collections-come-from`. Ids come from the heading text (lowercased, spaces to hyphens), so renaming an `##` or `###` heading breaks links people have shared to it. Every `##` and `###` heading gets a copy-link button automatically; link to another page's heading with `[text](#/ch01/page#heading-id)`.
- **Frontmatter** at the top of each page:

  ```yaml
  ---
  title: Managing Ansible configuration files
  kind: lesson        # lesson | lab | quiz | summary
  minutes: 8
  draft: true         # optional: hide the section from the site
  ---
  ```

- **Page data** lives beside the page in `NN-slug.data.yml`. Each top-level key is a `ref` that one tag on the page uses; the compiler rejects a missing or unused ref.
- **A new chapter**: create `content/programs/<program>/chapters/chNN-name/` with a `_chapter.yml`. Once it contains `.md` pages and has no `status: planned`, it becomes a normal chapter.

While `npm run dev` is running, saving any content file recompiles it and reloads the page.

The page title, number, breadcrumb, reading time, table of contents, "mark complete" button and previous/next links are generated. **Do not** put an `# H1` in a page.

## Track reference pages

A program's reference page is `details.md` in its folder; the interface metadata in `legacy.yml` supplies its label, version metadata and header-badge text. The page frontmatter supplies `title`, `eyebrow`, and `description`. The header badge links to `#/<program>/platform`; `ReferencePage` renders the page with the same typography, heading links, and table of contents as lessons. It does not count as a curriculum section or change reading completion.

`flow-map` renders a two-to-four-step sequence using the existing pale diagram tones. Its steps live in the page data; each step needs a unique `id`, `title`, and explanatory `text`, with optional `sub` and `tone`. `connections` labels the arrows. For example:

```markdoc
{% flow-map ref="journey" title="A playbook's journey" caption="Choose a step for its explanation." /%}
```

```yaml
# platform.data.yml
journey:
  connections: [SSH]
  steps:
    - { id: control, title: Control node, sub: starts tasks, tone: purple, text: Read the project and run its tasks. }
    - { id: managed, title: Managed host, sub: stores the result, tone: green, text: Verify the requested state here. }
```

Native buttons select explanations, and the diagram changes to a vertical layout on phones. Keep machine names, operating systems, versions, captions, and teaching text in content or track metadata. The component contains presentation logic. Keep existing reference headings when updating content so shared links continue to work.

The site's own home page is `content/site/home.md`; use `{% program-cards /%}` to list the programs. To announce a program before its lessons exist, give it `status: planned` and a folder per chapter whose `_chapter.yml` has `status: planned` and a list of `topics`; readers see the outline with "Coming soon" chapters, and the program is marked Planned on the site home and in the program menu (`content/programs/rhel9-sysadmin` is an example). To add a program, create `content/programs/<id>/` with a `program.yml` and `chapters/`, then list the id in `site.yml`. Each program has its own navigation, search index and progress.

## 2. Page shape

Aim for 5–12 minutes: purpose, a small example, an activity, an explanation, and a short recap. Put deeper details in optional reveals. A lesson can start like this:

```markdoc
{% lead %}
One or two sentences on why this matters.
{% /lead %}

{% objectives %}
- Three or four things the reader will be able to do.
{% /objectives %}

## First topic
...prose, a diagram, a code block...

{% quiz id="check" objectives=["ch03.playbooks"] ref="check" /%}
```

Use `##` for topics and `###` for sub-topics; both appear in the table of contents.

## 3. Writing style

- **Write in your own words, from open sources:** the public exam objectives, the Ansible and RHEL documentation, and your own testing on the lab. Do not copy or closely paraphrase training materials or books. Commands, file contents and directive names are fine to reproduce.
- Short sentences, second person ("you"), active voice. Explain *why* before *how*.
- Use the classroom host names (`workstation`, `servera`–`serverd`, `utility.lab.example.com`) and documentation IP ranges (`192.0.2.0/24`). Never real personal hosts, users or addresses.
- Always use FQCNs in examples (`ansible.builtin.copy`).
- Only state exam facts you can back up. Phrase advice as practice habits, not as claims about how the exam is graded.

## 4. Tags

(Every tag and attribute is listed in the generated [component catalog](CATALOG.md); this section explains how to use the common ones.)

Pages use Markdown plus Markdoc tags: `{% name attribute="value" %}…{% /name %}`, or `{% name … /%}` for a tag without content. Every tag and attribute is declared in the component catalog (`packages/schema/catalog/components.json`), and the compiler rejects anything else. The engine renders tags through `packages/engine/src/components/content/registry.jsx`.

| Tag | Use |
| --- | --- |
| `lead` | Opening paragraph, larger text. |
| `objectives` | "In this section" box. Put a Markdown list inside. |
| `callout type="note\|tip\|important\|warning\|exam" title="…"` | Asides. `exam` is for exam-specific advice. |
| `cards cols=2` + `card title kicker tone` | Side-by-side comparisons. |
| `columns` + `column title tone` | Two-column contrasts (bad vs good). |
| `tabs` + `tab label` | Alternatives, for example file templates. |
| `steps` + `step title` | Numbered procedures inside a lesson. |
| `glossary` + `term name` | Definition lists. |
| `reveal title="Show solution"` | Hidden answers. |
| `kbd` | A key, inline: `{% kbd %}Ctrl{% /kbd %}`. |
| `quiz id objectives ref` | Multiple choice; the questions (`id, q, options, answer, explain, code?`) live in page data. One question renders as a compact "quick check". |
| `lab id objectives title outcomes hosts exercise` + `task id title` | Exercises with persisted checkboxes. `task` must be a direct child of `lab`. |
| `flashcards ref` | Revision cards; the cards (`front, back`) live in page data. |
| `practice ref` | The chapter's practice questions on its quiz page. |

Text values in page data (quiz text, card text) support `` `code` ``, `**bold**` and `*italic*`.

`tone` is one of `purple`, `teal`, `coral`, `pink`, `gray`, `blue`, `green`, `amber`, `red`.

Attribute values are text in double quotes, numbers, `true`/`false`, or lists such as `["a", "b"]`. Markdoc variables (`$name`), functions and annotations (`{% #id .class %}`) are not allowed, and raw HTML is shown as text.

### Code blocks

````markdoc
```yaml {% title="site.yml" %}
- name: Example
```
````

- `{% title="…" %}` after the language shows a filename in the header.
- `console` blocks render as a terminal; their copy button copies only the commands, without prompts or output.
- `text` is for command output.
- Add `# [!code highlight]` at the end of a line to highlight it.
- Code is never scanned for tags, so Jinja such as `{% for %}` is safe inside code blocks and inline code. In prose, put it in inline code.

## 5. Diagrams

### Diagrams from data

Most diagrams are data: `{% diagram ref="architecture" /%}` with the drawing under that key in the page's data file. The diagram uses the platform's shared look (flat pastel boxes, hairline borders, thin grey arrows) on a `680`-wide canvas that scales to fit. It cannot contain code, markup or colours of its own.

```yaml
architecture:
  title: How the pieces connect
  caption: Select a box to see what it does.
  height: 200
  mode: select              # static (default) | select | steps
  elements:
    - { kind: group, x: 10, y: 10, w: 300, h: 180, tone: gray, label: Control node }
    - { kind: node, x: 30, y: 50, w: 140, h: 56, tone: purple, title: site.yml, sub: desired state, select: playbook, active: [playbook], visible: [playbook] }
    - { kind: arrow, points: [[170, 78], [240, 78]], label: runs, hot: [playbook] }
  info:
    playbook: { title: The playbook, text: Describes the state you want. }
```

- **Elements** are `node`, `group`, `arrow`, `label` and `badge`, each with plain coordinates and optional `tone` (`gray`, `purple`, `teal`, `coral`, `pink`, `blue`, `green`, `amber`, `red`). `sub` may be a list of up to three lines.
- **Static** diagrams need nothing else.
- **Select** diagrams make elements clickable with `select: <key>`. Selecting a box shows `info.<key>` underneath. `active` lists the views in which an element is highlighted, `hot` the views in which an arrow is accented, and `visible` the views in which it is **not** faded (every other view fades it). Set `initial: <key>` to open with a box selected; without it, selecting a box again clears the selection.
- **Steps** diagrams list `steps` (`title`, `text`) and use step numbers (`0`, `1`, …) as the views in the same fields. `overrides` changes a property per step, for example `overrides: { sub: { 0: before, 3: after } }`.
- `<HOST_LAN_IP>` and the other lab values in a node's `sub` are replaced with the reader's own values once entered.

The compiler rejects unknown element kinds or properties, so a typo is an error, not a silently missing arrow.

### Interactive kits

The remaining interactive widgets (simulators, calculators, resolvers) are platform code, each a catalog tag of its own (for example `{% loop-unroller ref="loop-unroller" /%}`) bound to page data. To add one, write a component with the kit as follows; it is the exception, not the rule.

```jsx
import { Arrow, Diagram, Group, Node } from '../kit';

export default function Example() {
  return (
    <Diagram height={200} title="Accessible description" caption="Shown under the figure.">
      <Group x={10} y={10} w={300} h={180} tone="gray" label="Control node" />
      <Node x={30} y={50} w={140} h={56} tone="purple" title="site.yml" sub="desired state" />
      <Arrow points={[[170, 78], [240, 78]]} label="runs" />
    </Diagram>
  );
}
```

- **`Node`** takes `tone`, `title`, `sub` (string or array of lines), `mono`, `align="start"`, and for interactive diagrams `onClick`, `active` and `dim`.
- **`Arrow`** takes a list of points; corners are rounded automatically. Options: `label`, `labelAt`, `labelDx`, `labelDy`, `dashed`, `hot` (accent colour), `dim`.
- **`Group`** is a dashed container; `solid` makes it solid.
- **`InfoPanel`** (pass it through `below`) explains the selected node in clickable diagrams.
- **`useStepper` + `StepControls`** build step-through diagrams (see `TaskLifecycle`).

Colours come from CSS variables, so every diagram switches to dark mode automatically. Never hard-code colours in a diagram.

Export new diagrams from `packages/engine/src/diagrams/chNN/index.js` and add a catalog entry flagged `kit` (the tag is the name in kebab case) with a data schema in `packages/schema/schemas/data/kits/`, then run `npm run schema:validators`; a page then uses it with `{% name-in-kebab-case ref="name" /%}` (the build plugin discovers `export { default as Name }` entries and loads the chapter only when a widget renders). Chapter widgets are being replaced by generic, data-driven catalog components. Put a chapter's widget styles in `packages/engine/src/diagrams/chNN/chNN.css` and import it from that `index.js`.

Reusable pieces from chapter 4 that later chapters can use: `ProjectTree` for directory layouts and `DataExplorer` for any nested variable or JSON result. Their settings go under `props` in the widget's page data.

### Lab placeholders

Write per-reader values as `<HOST_LAN_IP>`, `<HOST_USER>` or `<ROUTER_IP>` inside code blocks or inline code. They are highlighted, and replaced with the reader's own values once entered in the `{% reader-variables /%}` form (section 1.1), including in copied text. Add new placeholder keys in `packages/engine/src/lib/placeholders.jsx`.

### Classroom and home lab

Readers follow the guide either in the Red Hat classroom or on the home lab from Chapter 1. Where the two differ, show both. The reader's choice is one site-wide preference.

| Tag | Use |
| --- | --- |
| `variant-group` containing `variant name="classroom"` and `variant name="homelab"` | Two versions of a command, file or output. A switch shows one at a time. |
| `variant name="homelab" title="…"` on its own | An always-visible note for home-lab readers (teal callout). |
| `lab exercise="NAME"` | Adds the "Before you begin" box with both environments. At home it lists the starter files of the exercise's `starter/` folder. Add `starter=false` if there are none. |
| `lab exercise="NAME" ownExercise=true` | For an exercise that exists only in this guide: the classroom tab then tells readers to create the folder themselves. |
| `lab-setup variant="homelab"` inside `lab` | Extra home-lab preparation notes for that exercise. |
| `lab-finish exercise="NAME" /` (add `grade=true` for chapter labs) | The body of an exercise's last task, for both environments. |

Keep the classroom commands as the default text of an exercise, and use these only where the home lab really differs (no execution environment, Rocky facts, firewalld running, `sdb` for `vdb`).

### Exercises: starter files, setup and checks

An exercise is data. Everything it needs lives in `content/programs/<program>/lab/`:

```text
lab/
  system-users.yml            the definition (below)
  system-users/
    starter/                  files copied into ~/system-users by `lab start`
      ansible.cfg
      inventory
      vars/users_vars.yml
    trees/                    file trees that setup actions use, for example the commits of a Git remote
```

```yaml
name: system-users                  # what learners type: lab start system-users
title: Managing users and authentication
page: ch10/lab-users                # the section that teaches it; it must contain {% lab exercise="system-users" %}
version: 2                          # raise it whenever the checks change
starter: [ansible.cfg, inventory, vars/users_vars.yml]
setup:
  - { action: ssh-keypairs, dir: files, names: [user1, user2] }
checkpoints:
  final:                            # more checkpoints are allowed (see the grading guide)
    files: [users.yml]              # project files that must exist and be non-empty
    groups:                         # inventory groups the learner's inventory must define
      webservers: [servera.lab.example.com]
    checks:
      - { id: sudo, kind: sudoers, on: webservers, targets: [servera.lab.example.com], message: The policy is valid and protected, path: /etc/sudoers.d/webadmin, mode: "0440", valid: true }
```

**Content supplies values, never commands.** The compiler checks every exercise against the lab schema, and the lab tools (`packages/lab-tools`) own what each action and check does. A check that needs something the tools cannot do is a request for a new kind, not a shell line.

| Check `kind` | Values it takes |
| --- | --- |
| `service` | `names`, `active`, `enabled` |
| `firewall` | `service`, `port`, `source` or `forwardPort` (optionally in a `zone`), `allowed`, `runtime`, `permanent` |
| `package` | `names`, `installed`, `verify` |
| `file` | `paths` (any one may satisfy), `exists`, `nonEmpty`, `contains`, `lacks`, `line`, `lines`, `matches`, `contentEquals`, `mode`, `owner`, `group`, `selinuxType`, `symlinkTo`, `executable`, `acl` |
| `file-compare` | `a`, `b` |
| `archive` | `path`, `format` |
| `user` | `names`, `exists`, `groups`, `passwordSet`, `authorizedKeys`, `homeFile` |
| `mount`, `logical-volume` | `path`, `fstype`, `persistent`; `vg`, `lv`, `minSizeMiB` |
| `http` | `url` (to the managed host itself), `insecure`, `resolveToLocalhost`, `containsAny` |
| `partition`, `container` | `device`, `minSizeMiB`, `partLabel`, `tableType`, `fsType`, `fsLabel`; `user`, `image`, `running`, `unit`, `linger` |
| `selinux`, `sudoers`, `sshd`, `cron`, `boot-target`, `address`, `hostname`, `commands` | see the lab schema |
| `git`, `lint` | on `control` only: the project's Git state, and `ansible-lint` in a container |

- `on` is an inventory host or group pattern (groups joined with `:`), or `control` for the learner's project folder. A check on managed hosts must list its `targets`; a missing target fails instead of passing silently.
- `{host}` and `{hostShort}` in paths and text are replaced with the inventory name and its first label.
- Setup actions: `self-signed-cert`, `htpasswd`, `password-hash-var`, `vault-encrypt`, `ssh-keypairs`, `pack-installed-collection`, `build-collection`, `collection-requirements` and `git-seed-remote`.
- Starter and tree files are published with a `.lab` suffix so a browser never renders them, and a name part that starts with a dot gets a `_` in front (`files/.htaccess` is published as `files/_.htaccess.lab`), because static hosts leave dotfiles out. The lab command saves them under their real names. Do not name a file starting with `_.`; that form is reserved.

#### Guided exercises: start, grade and finish on the servers

A guided exercise (a step-by-step page, `{% lab exercise="NAME" guided=true ownExercise=true %}`) has no challenge brief, but it is still an exercise definition. The lab tool does three jobs for it:

- **`lab start NAME`** copies the starter files and runs the `setup` actions, which prepare what the exercise needs but does not teach: install a package, create the users and files an earlier exercise left behind, start a broken service. Tasks that only did this preparation are removed from the page and replaced by a "Start the exercise" task.
- **`lab grade NAME`** runs the typed `checks` against the state the tasks leave behind.
- **`lab finish NAME`** runs the `finish` actions on the servers, then archives the project folder. The last task of the page is `{% lab-finish exercise="NAME" grade=true servers=true /%}`, which tells the reader that the servers are cleaned. Each finish action is best effort: one that fails is reported and the others still run. `rht-vmctl reset servers` remains the way to the exact clean baseline.

`setup` and `finish` use the same typed actions. **Host actions** run as root on the named lab servers (`hosts: [servera]`) and are built by `prepare.py` from validated values: `package`, `service`, `group`, `user`, `directory`, `file`, `remove-lines`, `append-line`, `acl`, `firewall`, `selinux`, `systemd`, `linger`, `boot`, `timezone`, `hostname`, `nm-connection`, `crontab`, `dnf-module`, `http-server`, `partition-disk`, `format`, `lvm-build`, `mount-all`, `unmount`, `wipe-disk`, `restore-skel`, `container-reset` and `run-as`. Path values are limited to places meant for local data and drop-in configuration (`/srv`, `/opt`, `/mnt`, `/data`, `/home`, `/tmp`, `/var/log`, `/etc/*.d` and a few more), the top directories themselves and whole home directories can never be removed, and `remove-lines` and `append-line` only touch `/etc/fstab`, `/etc/exports`, `/etc/hosts` and `/etc/chrony.conf`. **Workstation actions** work in the learner's home and refuse shell start-up files and the lab's own keys: `home-remove`, `ssh-config-block` and `ssh-identity`.

Write the checks for the state at the moment the page asks to grade, and make the setup produce the state the first remaining task assumes, and say in the Start task where the reader works (for example "change to `/srv/lab7`"). Run the whole page against the lab (`lab start`, the tasks, `lab grade`, `lab finish`, `lab grade` again) before you publish it.

The compiler publishes the lab tree (the `lab` command, the grader, starter files, `INDEX`, and a `MANIFEST` per exercise) with the rest of the site, and the build also places it at `/lab/`. Try an exercise end to end with `npm run build`, then `LAB_URL=file://$PWD/dist/lab bash dist/lab/lab start NAME`, and run its solution against the lab before you publish it.

## 6. Code font

All code uses the `--font-mono` token (JetBrains Mono, with code ligatures turned off so `!=` and `->` show as typed). Sizes come from `--code-size` (blocks and terminals), `--code-size-sm` (compact widgets) and `--code-inline` (inline code in text). Use these tokens rather than hard-coded values.

## Content tables

Write ordinary Markdown tables. Every table uses `Table.jsx`; no per-page classes or width settings are needed. Desktop tables stay inside the reading area with content-based column widths, a muted header, lightly shaded alternate rows, and headers that remain visible while scrolling. Commands and long paths wrap visually; their original text remains available for selection and copying.

The established labelled row cards appear when a table's container is 640 pixels wide or narrower. This uses the available content space, so tables inside a narrow lab task also adapt on a desktop. Keep headers short and descriptive: they become each value's label in the card layout. Empty headers remain supported, and Markdown column alignment is preserved. Add a code block below a table when a whole procedure needs a copy button.

Keep explanations in the content and shared presentation in the renderer/styles. Do not add horizontal scrolling, fixed pixel widths, clipped descriptions, or per-lesson table designs to work around long content.

## Visual consistency and exercise titles

Reuse the existing component treatments and theme tokens. Every knowledge check, including chapter practice, uses the one `Quiz` format: pick an option, get instant feedback and an explanation. Solutions use `reveal` and code blocks. Environment and exercise modes share `OptionSwitch`. Keep controls neutral and use the existing pale success/failure surfaces for feedback; do not add a separate accent palette for an activity.

Use `Exercise: Topic` for practical exercise titles, whether they offer Guided or Challenge mode. Use `Assessment: Topic` for integrated assessments. Keep sentence case and a colon separator. Setup pages describe their setup step directly. Display titles can change without renaming published filenames, activity IDs, or objective IDs.

## 7. Stable activities and skills

Give each question and task a unique, descriptive ID, such as `ch03-inventory-child-groups` or `ch03-inventory-verify`. Keep it when moving or improving the activity. New activities do not need `legacyIndex`; preserve the existing indices and frozen `packages/engine/src/data/legacyActivityMap.json` for earlier learners.

```markdoc
{% quiz id="check" objectives=["ch03.inventory"] ref="check" /%}
```

```yaml
# NN-slug.data.yml
check:
  questions:
    - id: ch03-example-group-membership
      q: Which group contains the child group's hosts?
      options: [The parent, Only the child]
      answer: 0
      explain: A parent includes the hosts of its children.
```

Add or update the objective in the program's `objectives.yml` and the chapter's `objectiveIds`. Each objective links to its teaching, practice, and lab pages. Use original explanations and cite public documentation where a version difference matters.

Practice questions are authored in their chapter's quiz page as `{% practice ref="practice" /%}`, with the questions under `practice.questions` in its data file. Each one is multiple choice, exactly like a quiz question: supply a stable `id`, objective, `title`, `prompt`, at least three `options`, the `expected` option (copied exactly), an explanation, and an optional `code` snippet shown above the options. Do not add typed-answer, hint or solution variants; consistency across pages matters more than a one-off format. The dashboard reads the same data; editing wording needs no code change. Check every distractor against real Ansible behavior so exactly one option is right.

Lab wording belongs in content. A graded `lab` contains exactly one `lab-notes` and one `lab-challenge`, alongside its `task` children. `lab-notes` holds prerequisites and optional verification/variation reveals. `lab-challenge` holds a short purpose and a list of outcomes, target values, and constraints. Write these as requirements a learner can solve independently: avoid prescribing each module, YAML key, and task order unless that technique is itself the skill being assessed.

```markdoc
{% lab id="site" title="Publish a web page" exercise="example-site" objectives=["ch03.playbooks"] %}
{% lab-notes %}
**Prerequisites:** working SSH and sudo access to the target.

{% reveal title="Verify your work" %}
Fetch the page from workstation, repeat the deployment, and inspect unexpected changes.
{% /reveal %}
{% /lab-notes %}

{% lab-challenge %}
Publish the supplied page on the inventory's web hosts.

- Apache must run now and start at boot.
- Workstation must receive the supplied content over HTTP.
{% /lab-challenge %}

{% task id="example-site-service" title="Prepare the web service" %}
Explain the purpose, show the small step, and say how to verify it.
{% /task %}
{% /lab %}
```

Guided mode renders tasks normally. Challenge mode renders the authored requirement brief and keeps the entire task walkthrough/checklist closed until requested. Components never guess which child is a question or manufacture a hint from the remaining children. Setup labs without an authored challenge show the walkthrough only. Keep solutions inside nonempty `reveal` tags; never publish an empty disclosure.

The grading catalog contains only machine-check contracts and intentionally broken fixture declarations. Teaching text is not fetched from it.

For a new exercise, add its definition to `lab/` as described above. Use named checkpoints where later tasks intentionally remove earlier results. Raise the exercise version when the grading contract changes, then regenerate the browser report schema:

```bash
node scripts/generate-report-schema.mjs
```

Never treat a mocked passing check as real host validation. Test the published solution, a deliberate broken state, repeat execution, reset behavior, and reboot persistence where relevant. Record the tested stack and limitations in `docs/VALIDATION.md`.

## 8. Before you commit

```bash
npm run format
npm run format:check
npm run validate:content
npm test
npm run test:labs
npm run build
python3 -m pip install -r tests/browser-requirements.txt
python3 -m playwright install chromium
npm run test:browser
```

Then open the page in both light and dark mode, and at phone width.

For the behavior-comparison script, use a disposable control-node environment with Ansible installed:

```bash
python3 scripts/validate-ansible-simulations.py
```

It creates a temporary local project, uses the local connection, and prints the runtime and passed comparisons. It does not validate remote system-administration labs.

## Page-owned interactive examples

Chapter widgets render shared components; their explanations, examples, labels, diagrams, and sample facts belong to the page that uses them. A widget's copy goes under its ref in the page data file:

```yaml
inventory-explorer:
  data:
    sample: "[web]\nservera"
    initialSelection1: all
  text:
    widgetLabel: Edit the inventory
```

This is a shortened illustration. Copy the complete entry from an existing page using the same widget, then edit its data and wording. A widget that renders another widget inside itself lists that widget's copy under `dependencies`. `npm run validate:content` checks every required key and composed widget dependency. Keep field names stable; update the component contract when a new field is needed. Widget data is not indexed as lesson prose.

`PageTree` supplies each widget's copy through `TeachingContentProvider`. Components use `defineWidget(name, createRenderer)` to bind that data; state and evaluation stay in the reusable renderer. A normal shell or theme update retains the renderer and the learner's input. A composed widget also needs its child widget's catalog on the page. Shared interface labels live in `content/interface.json`; a program's landing page owns `home.json`, and its dashboard owns `progress.json`.

Use `{value0}`, `{value1}`, and so on for wording that contains calculated values. The component calls `formatCopy` with the corresponding values. Keep algorithms, state keys, semantic enum values, selectors, and styling in code; keep teaching sentences and example datasets in content. A future content track can supply its own catalogs to the same components.

## Shared mobile rendering

Authors use the same tags on phones and desktops. `LearningPageLayout` supplies the responsive outline; `CodeBlock` provides mobile wrapping; `CodeEditor` supplies indentation, wrapping, and native keyboard navigation. Use `CodeEditor` for editable code instead of adding a page-specific textarea or toolbar. The diagram kit scales its canvas to the available width and supplies a focus-managed enlarged view with optional zoom. Keep dimensions in the SVG viewBox; do not impose that coordinate width on the page layout. Use existing theme tokens and shared controls, and put responsive behavior in shared styles rather than individual lessons.
