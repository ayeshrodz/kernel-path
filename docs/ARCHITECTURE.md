# Architecture

Kernel Path is a static React application. GitHub Pages serves the built files; learning progress stays in the reader's browser. There are no accounts, server APIs, analytics, or paid dependencies.

The public site is `https://kernelpath.dev/`; `packages/engine/public/CNAME` records the configured custom domain and is copied into the build. The source repository is `ayeshrodz/kernel-path`. Site branding comes from `content/site.yml` and the program's `legacy.yml`, including the dashboard document title.

## Content and routing

The compiler (`packages/compiler`) turns `content/` into a static bundle of JSON files: a site index, a program manifest, one render tree per page, and a search index. At startup the engine (`packages/engine`) fetches the bundle from `contentBase` in `kernel.config.json`, validates every file with the generated validators from `@kernel-path/schema`, and `src/lib/course.js` exposes navigation and page lookup. Pages load on demand. `PageTree` renders only allowlisted elements and catalog tags; see [PLATFORM.md](PLATFORM.md) for the platform design and security model.

Every page has its own address, for example `/rhel9-ansible/ch03/inventory/` (program, chapter, section). The build (`scripts/prerender.mjs`) writes a real HTML file for each one, with its title, description, canonical address, social-card tags, structured data and the page's text, so a static host serves deep links and search engines can index each page; `404.html` lets the app handle any other address. Old hash addresses (`#/rhel9-ansible/ch03/inventory`, and `#/ch03/inventory` without a program) move to the path form when they open. The engine loads one program at a time; the program route remounts its pages when the reader moves to another. A second hash identifies a heading or activity. Keep published filenames, heading text, and stable activity IDs when editing. Links into optional reveals open their containing details.

`content/programs/<id>/objectives.yml` maps stable skill IDs to lessons, challenges, and labs. Each chapter lists its objective IDs; quizzes and labs reference the skills they practise.

## Track boundary and platform reference

Site identity lives in `content/site.yml`, which also lists the programs in order. Each program is a folder, `content/programs/<id>/`, with a `program.yml` (platform family and version, stages, variants, reader variables) and an optional `details.md` reference page. `packages/engine/src/lib/course.js` exposes the active program's `track` alongside the course and chapter data.

The header badge links to `#/platform`. The lazy `ReferencePage` receives a page descriptor and loads its compiled page; it contains no RHEL-specific wording. `FlowMap` renders authored steps with the existing diagram kit and muted controls. Lessons and reference pages share `useHeadingNavigation` for copied links, table-of-contents navigation, and opening optional details. Reference pages have no completion key and do not replace the last visited lesson.

Programs are separate: each has its own manifest, pages and search index, and its own progress, stored under `rhce:<program>@<key>` and exported with the program's name. Display preferences (theme, lab values) are shared. Lab downloads and grading are still shared and move into programs with the typed labs. Resetting, exporting or importing progress affects only the open program, and an export from another program is refused.

## Shared content tables

`packages/engine/src/components/prose/Table.jsx` renders all Markdown tables in compiled pages. It keeps content unchanged, adds explicit table/header semantics and mobile labels, and generates column widths from typical text length through `tableLayout.js`. A single exceptional command cannot dictate the table's width.

`prose.css` constrains desktop tables to the article, wraps prose and code, and keeps headers visible during long-table reading. Container queries preserve labelled row cards below 640 pixels of available table space, including tables inside lab tasks and other nested content. The renderer is shared across chapters and track reference pages; authors continue to write plain Markdown tables.

## Learning activities

`ActivityPanel`, `AnswerOptions`, and `ActivityFeedback` provide shared quiz/practice chrome. `OptionSwitch` renders both environment and exercise modes with the same muted treatment. `Reveal` supports optional controlled state for solution-view tracking; `CodeBlock` supplies the same code presentation throughout. Activity wording and grading definitions remain in content, separate from these rendering components.

- `Quiz.jsx` stores attempts by question ID. Question revisions come from the question, options, and answer. Corrections request another attempt and retain history.
- `Lab.jsx` stores checked task IDs separately from reading completion. Guided mode shows the procedure; Challenge mode renders the authored `lab-challenge` requirements and keeps the full guided walkthrough closed until requested. `lab-notes` supplies prerequisites, verification, and independent variations. Setup labs without challenge briefs expose only the walkthrough.
- Each chapter quiz page's data file defines its practice questions; the compiler lists them in the program manifest, and `course.js` exposes them as the shared dashboard registry. `ChapterPractice` renders them through the same `Quiz` component as every other knowledge check, and also logs each answer as a `challenge:<id>` attempt for the dashboard.
- Chapter diagrams are React/SVG components. `packages/engine/plugins/chapter-widgets.js` discovers named default exports in chapter indexes and creates lazy wrappers. Chapter widgets, browser challenges, search, and the progress dashboard load when needed.
- `AssessmentTimer.jsx` persists an optional end time. The two integrated assessments have independent requirements, solutions, and local graders.

## Browser progress

`packages/engine/src/lib/storage.js` wraps individual `rhce:` localStorage keys and subscriptions. The original prefix is retained so earlier progress survives. Same-tab writes and cross-tab storage events update readers; unavailable storage falls back to memory and shows a warning.

Version 2 exports include reading completion, quiz history, task completion, challenge attempts, confidence, timers, and imported lab reports. Preferences are separate. Imports validate every entry before replacing progress. Invalid stored entries are preserved on disk, ignored by the UI, and omitted from exports.

`progressModel.js` migrates older positional activity data using the frozen `legacyActivityMap.json`. Never regenerate that map from reordered content. `labReports.js` validates imported reports against the generated, versioned `labReportSchema.json`.

The dashboard combines these independent signals into a next lesson, review queue, practice links, and skills to revisit. It does not predict an exam score.

## Local lab tooling

The lab tools live in `packages/lab-tools`: the `lab` command, the grader and the setup program. They run on the learner's own machine, and the compiler publishes them with the exercises. `lab start` downloads an exercise into a staging directory, moves it into place, and then `prepare.py` runs the typed setup actions named in the catalog. Failed preparation is explicit and preserves existing work. Each exercise has a `MANIFEST` of starter files; the index and the catalog cover every published exercise.

`grade.py` checks project files, inventory groups, and the typed read-only checks defined in `graders.json`. It uses the learner's Ansible connection settings. Checks report PASS, FAIL, or SKIP and link to the lesson. Grading does not run playbooks or repair systems. See [lab grading](LAB-GRADING.md) for report and exit-code contracts.

## Build and checks

React 19, React Router 7, Vite 8 and CSS build the engine into `dist/`; the compiler (Markdoc, YAML, Shiki) builds the content into `dist/content/`. `base` is `/` (or `SITE_BASE` for a sub-path), and the prerendered pages plus `404.html` support GitHub Pages. The build also writes `sitemap.xml` and `robots.txt` for the address in `SITE_URL` or the `CNAME` file.

PR CI runs formatting, content validation, JavaScript regressions, Python lab-tool tests, a production build, and Chromium learning-flow checks. Content validation covers routes and heading links, activity/objective IDs, quiz answers, starter manifests, setup syntax, and grader coverage. Browser checks cover every route plus mobile layouts, focus, persistence, and imports.

`.github/workflows/deploy.yml` publishes pushes to `main`. Maintainers control PR readiness and merging. Outstanding VM and desktop workflow checks remain recorded in [validation evidence](VALIDATION.md), including when the maintainer requests ready status before those checks are complete.

## Mobile rendering and authored widget catalogs

`LearningPageLayout` is the shared lesson/reference boundary. Its single outline appears as a disclosure in the article on compact screens and as the existing aside on wide screens. Heading navigation preserves hash links and moves focus to the selected heading.

`mobile.css` centralizes safe-area spacing, editor text size, wrapping, and overlay bounds using the existing palette. Controls retain their shared size variants; labels can wrap instead of imposing one minimum size on every button. `useOverlay` combines the shared focus trap with scroll locking and visual-viewport measurements; navigation, search, mobile progress, and diagram views use it. Mobile progress uses a portal so its bounds are independent of the header. The shell owns one active header overlay, preventing navigation, search, and progress from stacking focus traps. The diagram kit scales SVGs to their container at every viewport width. The enlarged view also starts fitted; readers can explicitly zoom to twice the available width, then return to fit. Its marker IDs are distinct between inline and enlarged instances.

`StepDots` supplies the same step selector to diagram walkthroughs and annotated YAML. On touch screens its compact dots sit inside compact rem-based targets that wrap within the available space.

`CodeEditor` retains controlled input and adds shared indentation tools without capturing Tab. `editor.js` changes selected lines and maps selection positions. Code blocks wrap by default on phones and let readers switch to horizontal scrolling; clipboard extraction uses the original DOM text, independent of visual wrapping.

`PageTree` provides each page's widget data. `defineWidget` binds page-authored text/data to a reusable renderer with stable identity, preserving local activity state across ordinary rerenders. Shared interface and landing-page catalogs come with the program's compiled bundle. Search and reading-time helpers exclude this widget data. The widget contract validator checks required fields and child dependencies.

`tests/mobile_checks.py` covers all published routes at phone and tablet widths plus overlay, outline, editor, diagram and rerender behavior. It supplements the existing production-route and learning-flow suite; physical iOS and Android validation is separate.
