# Kernel Path

[![Deploy](https://github.com/ayeshrodz/kernel-path/actions/workflows/deploy.yml/badge.svg)](https://github.com/ayeshrodz/kernel-path/actions/workflows/deploy.yml) [![Code: MIT](https://img.shields.io/badge/code-MIT-blue)](LICENSE) [![Content: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey)](LICENSE-CONTENT)

**Read it online: https://kernelpath.dev/**

**Free RHCSA and RHCE study courses, learned by doing.** Two interactive paths on RHEL 9: [Linux system administration for the RHCSA (EX200)](https://kernelpath.dev/rhel9-sysadmin/) and [Ansible automation for the RHCE (EX294)](https://kernelpath.dev/rhel9-ansible/). Short lessons with diagrams you can click, practice terminals in the browser, quizzes, cheat sheets, and graded exercises on a practice lab you build on your own computer. It is written by learners, for learners. Exam study maps link every objective to the lessons that teach it: [RHCSA objectives](https://kernelpath.dev/rhel9-sysadmin/ch22/rhcsa-exam-objectives/), [RHCE objectives](https://kernelpath.dev/rhel9-ansible/ch11/rhce-exam-objectives/).

> An independent, community-made study companion. Not affiliated with, sponsored by, or endorsed by Red Hat, Inc. Red Hat, RHEL, RHCSA and RHCE are trademarks of Red Hat, Inc. It is not official training material and does not replace Red Hat's courses or documentation.

## Programs

| Program | Status |
| --- | --- |
| **Ansible automation on RHEL 9** (`rhel9-ansible`) | For the RHCE (EX294). Complete: 12 chapters, from building the practice lab to Git and development containers, with two integrated assessments |
| **Linux system administration on RHEL 9** (`rhel9-sysadmin`) | Complete: 22 chapters for the RHCSA (EX200), with guided exercises, graded labs and a capstone |

## Quick start

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev       # http://localhost:3000; content edits show live
npm run build     # the static site in dist/ (engine, content bundle, lab tools, schemas)
npm run preview   # serve the built site locally
npm test          # unit, contract and fuzz tests
npm run validate:content
npm run test:labs
npm run format
```

To write content, start a program or add to one with the scaffolder, then check it:

```bash
npx kernel new chapter rhel9-sysadmin containers-intro
npx kernel new section rhel9-sysadmin 21 first-container
npx kernel validate
```

The [authoring guide](docs/AUTHORING.md) explains the page format, and the [component catalog](docs/CATALOG.md) lists every tag. VS Code users get schema checking and `kp-` snippets from the committed `.vscode` settings (install the recommended extensions).

## Documentation

| | |
| --- | --- |
| [docs/AUTHORING.md](docs/AUTHORING.md) | Writing pages, diagrams, quizzes and exercises |
| [docs/CATALOG.md](docs/CATALOG.md) | Every tag content may use (generated) |
| [docs/PLATFORM.md](docs/PLATFORM.md) | The platform design, content contract and security model |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the engine works |
| [docs/HOSTING.md](docs/HOSTING.md) | Deploying, hosting content elsewhere, signed content |
| [docs/LAB-GRADING.md](docs/LAB-GRADING.md) | The `lab` command, grading and exercise checks |
| [packages/](packages) | A README per package: schema, compiler, engine, lab tools |

## How it is built

Kernel Path is being turned into a data-only learning platform (see [docs/PLATFORM.md](docs/PLATFORM.md)). It is three parts plus the content:

- **The contract** (`packages/schema`): JSON schemas for content and for the compiled bundle, the catalog of tags content may use, and generated browser validators.
- **The compiler** (`packages/compiler`, the `kernel` command): validates `content/` against the contract and compiles it into a static, content-hashed bundle. Code is highlighted at build time.
- **The engine** (`packages/engine`): a React 19 + Vite 8 player. At startup it fetches the bundle from the location in `kernel.config.json`, validates every file, and renders pages through its own components. It contains no course text and never renders raw HTML.
- **A site home and program selector.** `#/` lists every program with the reader's progress, from `content/site/home.md`; the header's program menu switches between programs. A program without authored landing or dashboard copy gets built-in ones, and a planned program shows its outline.
- **No backend.** Every page has its own address (`/rhel9-ansible/ch03/inventory/`: program, chapter, section), written as a real HTML file at build time. Progress is kept separately for each program. Progress, lab checklists, quiz answers and the last page read are stored in the reader's `localStorage`, sync across tabs, and can be exported or imported from the progress menu.

```
content/                          the course (see docs/AUTHORING.md)
packages/
  schema/                         the content contract
  compiler/                       `kernel validate|build`
  lab-tools/                      `lab`, the read-only grader and the exercise setup program (run on the learner's machine)
  engine/
    src/lib/content.js            fetches and validates the bundle
    src/lib/course.js             the loaded program: chapters, pages, objectives
    src/components/content/       render-tree renderer and tag → component registry
    src/components/              layout, interactive components, search
    src/diagrams/                 diagram kit and chapter widgets (moving to generic components)
    plugins/content-bundle.js     dev server: compiles content/ and serves it at /content/
    public/kernel.config.json     where the engine loads content from
scripts/                          content checks and build helpers
tests/                            browser, phone, lab and content tests
```

`npm run build` builds the engine into `dist/` and the content bundle into `dist/content/`; the lab tree (the `lab` command, exercise starter files and the grading catalog) is also placed at `dist/lab/`, where learners install it from. To load content from somewhere else (for example a CDN), change `contentBase` in `dist/kernel.config.json`. The security policy, optional content signing and cache rules are in [docs/HOSTING.md](docs/HOSTING.md).

See [validation evidence](docs/VALIDATION.md) for the tested stack and remaining host checks, [progress compatibility](docs/PROGRESS.md) for backups, and [local grading](docs/LAB-GRADING.md) for exercise checkpoints.

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push to `main`.

1. Push the repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually). The site appears at `https://<user>.github.io/<repo>/`.

The site is built for the root of its domain (`CNAME`). To serve it from a project sub-path instead, build with `SITE_BASE=/repo-name/` and `SITE_URL=https://user.github.io`; deep links work because every page is written as its own HTML file, and `404.html` covers the rest. `packages/engine/public/.nojekyll` stops GitHub from running Jekyll over the output.

## Contributing

Contributions are welcome: corrections, lab feedback, new chapters, diagrams. Fork the repository, make your change on a branch and open a pull request; the maintainer reviews and merges it, and merging redeploys the site. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and see [docs/AUTHORING.md](docs/AUTHORING.md) for how sections and diagrams are written. In short: write in your own words and keep commands tested.

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md). Security problems: see [SECURITY.md](SECURITY.md).

## License

- **Source code** (`packages/`, `scripts/`, build and configuration files): [MIT](LICENSE).
- **Written content** (`content/`, `docs/`) and the site's text and diagrams: [CC BY 4.0](LICENSE-CONTENT). Reuse is welcome with credit.

Red Hat, Red Hat Enterprise Linux and Ansible are trademarks of Red Hat, Inc. This project is independent and is not affiliated with, sponsored by, or endorsed by Red Hat, Inc.
