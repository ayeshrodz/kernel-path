# Component catalog

Every tag a page may use. This file is generated from `packages/schema/catalog/components.json`; do not edit it. Pages write a tag as `{% name attribute="value" %}…{% /name %}`, or `{% name … /%}` when it holds nothing. Attribute values are text in double quotes, numbers, `true`/`false`, or a list such as `["a", "b"]`.

[`admin-module-finder`](#admin-module-finder) · [`annotated-yaml`](#annotated-yaml) · [`assessment-timer`](#assessment-timer) · [`block-flow`](#block-flow) · [`build-roadmap`](#build-roadmap) · [`callout`](#callout) · [`card`](#card) · [`cards`](#cards) · [`check-mode-sim`](#check-mode-sim) · [`column`](#column) · [`columns`](#columns) · [`command-vs-module`](#command-vs-module) · [`condition-playground`](#condition-playground) · [`cron-builder`](#cron-builder) · [`custom-fact-builder`](#custom-fact-builder) · [`data-explorer`](#data-explorer) · [`diagram`](#diagram) · [`error-decoder`](#error-decoder) · [`fact-gathering`](#fact-gathering) · [`facts-explorer`](#facts-explorer) · [`feature-grid`](#feature-grid) · [`fetch-layout`](#fetch-layout) · [`file-edit-simulator`](#file-edit-simulator) · [`file-module-chooser`](#file-module-chooser) · [`flashcards`](#flashcards) · [`flow-map`](#flow-map) · [`fqcn-explorer`](#fqcn-explorer) · [`glob-tester`](#glob-tester) · [`glossary`](#glossary) · [`group-vars-resolver`](#group-vars-resolver) · [`handler-timeline`](#handler-timeline) · [`hero`](#hero) · [`host-pattern-tester`](#host-pattern-tester) · [`idempotency-demo`](#idempotency-demo) · [`inventory-explorer`](#inventory-explorer) · [`kbd`](#kbd) · [`lab`](#lab) · [`lab-challenge`](#lab-challenge) · [`lab-finish`](#lab-finish) · [`lab-network-map`](#lab-network-map) · [`lab-notes`](#lab-notes) · [`lab-setup`](#lab-setup) · [`lead`](#lead) · [`loop-unroller`](#loop-unroller) · [`magic-variables`](#magic-variables) · [`mode-calculator`](#mode-calculator) · [`module-explorer`](#module-explorer) · [`objectives`](#objectives) · [`play-order`](#play-order) · [`play-recap`](#play-recap) · [`practice`](#practice) · [`precedence-resolver`](#precedence-resolver) · [`program-cards`](#program-cards) · [`project-tree`](#project-tree) · [`quiz`](#quiz) · [`range-expander`](#range-expander) · [`reader-variables`](#reader-variables) · [`readiness-checklist`](#readiness-checklist) · [`reuse-simulator`](#reuse-simulator) · [`reveal`](#reveal) · [`role-anatomy`](#role-anatomy) · [`role-var-resolver`](#role-var-resolver) · [`run-stages`](#run-stages) · [`shell-practice`](#shell-practice) · [`snapshot-chain`](#snapshot-chain) · [`starter-files`](#starter-files) · [`stat-explorer`](#stat-explorer) · [`step`](#step) · [`steps`](#steps) · [`tab`](#tab) · [`tabs`](#tabs) · [`task`](#task) · [`task-outcome`](#task-outcome) · [`template-playground`](#template-playground) · [`term`](#term) · [`terminal-demo`](#terminal-demo) · [`variable-name-checker`](#variable-name-checker) · [`variable-precedence`](#variable-precedence) · [`variable-substitution`](#variable-substitution) · [`variant`](#variant) · [`variant-group`](#variant-group) · [`variant-switch`](#variant-switch) · [`vault-commands`](#vault-commands) · [`verbosity`](#verbosity) · [`yaml-multiline`](#yaml-multiline)

## admin-module-finder

Finds the module for a system administration job.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/admin-module-finder.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## annotated-yaml

A YAML example with each part explained on hover or selection.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/annotated-yaml.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## assessment-timer

An optional countdown for a timed practice assessment; survives reloads.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`)

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string (id) | yes | Stable id; the end time is stored under it. |
| `minutes` | integer (5–480) (default `90`) |  | Length of the session. |

## block-flow

Follows the path through a block, its rescue and its always section.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/block-flow.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## build-roadmap

A checklist-style roadmap of the steps to build the practice lab.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/build-roadmap.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## callout

A highlighted note beside the main text.

**Where:** on its own lines · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `type` | `note`, `tip`, `important`, `warning`, `exam` (default `note`) |  | What kind of note it is; sets the icon and colour. |
| `title` | string (shortText) |  | Heading; defaults to the type name. |

## card

One card in a card grid, with a heading, an optional kicker and a tone.

**Where:** on its own lines · **Inside:** `cards` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `title` | string (shortText) | yes | Card heading. |
| `kicker` | string (shortText) |  | Small label above the heading. |
| `tone` | `gray`, `purple`, `teal`, `coral`, `pink`, `blue`, `green`, `amber`, `red` (default `gray`) |  | Colour ramp. |

## cards

A responsive grid of cards that stacks on small screens.

**Where:** on its own lines · **Holds:** only `card`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `cols` | `2`, `3` (default `2`) |  | Columns on wide screens. |

## check-mode-sim

Compares a dry run with a real run of the same tasks.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/check-mode-sim.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## column

One column in a two-column layout.

**Where:** on its own lines · **Inside:** `columns` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `title` | string (shortText) |  | Column heading. |
| `tone` | `gray`, `purple`, `teal`, `coral`, `pink`, `blue`, `green`, `amber`, `red` (default `gray`) |  | Colour ramp. |

## columns

Two side-by-side columns that stack on small screens.

**Where:** on its own lines · **Holds:** only `column`

## command-vs-module

Compares a raw command with the module that does the same job.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/command-vs-module.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## condition-playground

Evaluates a conditional against chosen values to show whether the task runs.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/condition-playground.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## cron-builder

Builds a schedule entry and explains when it runs.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/cron-builder.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## custom-fact-builder

Builds a custom fact file and shows the variable it creates.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/custom-fact-builder.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## data-explorer

Explores a nested data structure and the expression that reaches each value.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/data-explorer.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## diagram

A diagram of boxes, groups and arrows. It can be static, let the reader select boxes to read an explanation, or step through a sequence.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/diagram.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of the diagram in the page data. |

## error-decoder

Matches an error message to its cause and the usual fix.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/error-decoder.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## fact-gathering

Shows when facts are gathered and what disabling gathering changes.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/fact-gathering.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## facts-explorer

Browses gathered facts and the expression that reads each one.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/facts-explorer.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## feature-grid

A grid of short feature descriptions, each with an icon.

**Where:** on its own lines · **Inside:** `page` · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/feature-grid.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of the items in the page data. |

## fetch-layout

Shows where fetched files are stored on the control side.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/fetch-layout.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## file-edit-simulator

Shows how a line-editing task changes a file.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/file-edit-simulator.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## file-module-chooser

Helps pick the file module that fits a described job.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/file-module-chooser.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## flashcards

A deck of flip cards for recall.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/flashcards.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of the deck in the page data. |
| `title` | string (shortText) |  | Deck title. |

## flow-map

A responsive sequence of steps with an explanation panel.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/flow-map.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of the flow in the page data. |
| `title` | string (shortText) |  | Diagram title. |
| `caption` | string (text) |  | Caption below. |

## fqcn-explorer

Breaks a fully qualified module name into its parts.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/fqcn-explorer.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## glob-tester

Try a file name pattern (globs and braces) against a directory and see exactly which names Bash passes to the command.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/glob-tester.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## glossary

A list of terms and definitions.

**Where:** on its own lines · **Holds:** only `term`

## group-vars-resolver

Resolves a host's variables from group and host variable files.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/group-vars-resolver.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## handler-timeline

A timeline showing when notified handlers run relative to tasks.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/handler-timeline.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## hero

The opening block of a landing page: heading, short introduction, two buttons and an animated illustration.

**Where:** on its own lines · **Inside:** `page` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `eyebrow` | string (shortText) |  | Small line above the heading. |
| `title` | string (shortText) | yes | Main heading. Wrap one word in asterisks in the intro, not here; the heading is plain text. |
| `art` | `lab` (default `lab`) |  | Which illustration to show beside the text. |
| `primary` | string (id) |  | Id of the program the first button opens. |
| `primaryLabel` | string (shortText) |  | Text of the first button. |
| `secondaryLabel` | string (shortText) |  | Text of the second button, which scrolls to the program cards. |

## host-pattern-tester

Tests a host pattern against an inventory and lists the hosts it selects.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/host-pattern-tester.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## idempotency-demo

Runs a task twice to show a repeat run changing nothing.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/idempotency-demo.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## inventory-explorer

Explores an inventory file: hosts, groups and the variables each host gets.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/inventory-explorer.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## kbd

A keyboard key, such as Esc or Ctrl+C.

**Where:** inside a line of text · **Holds:** inline text

## lab

A hands-on exercise with tracked tasks, notes and an optional challenge brief.

**Where:** on its own lines · **Holds:** only `task`, `lab-notes`, `lab-challenge`, `lab-setup`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string (id) | yes | Stable id; task progress is stored under it. |
| `title` | string (shortText) | yes | Exercise title. |
| `exercise` | string (exerciseName) |  | The lab tools exercise name (`lab start NAME`). |
| `ownExercise` | boolean (default `false`) |  | The exercise exists only on this platform; there is no classroom equivalent. |
| `starter` | boolean (default `true`) |  | `lab start` creates a starter project. |
| `hosts` | string[] |  | Labels for the machines the exercise uses, such as 'workstation' or 'Ubuntu host'. |
| `outcomes` | string[] |  | What the learner will have done. |
| `objectives` | string[] |  | Objectives the exercise practises. |

## lab-challenge

The requirements brief shown in Challenge mode.

**Where:** on its own lines · **Inside:** `lab` · **Holds:** Markdown

## lab-finish

How to grade and finish an exercise with the lab tools.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`)

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `exercise` | string (exerciseName) | yes | Exercise name. |
| `grade` | boolean (default `false`) |  | Also show the grading command. |

## lab-network-map

An interactive map of the practice lab's machines and how they connect.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/lab-network-map.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## lab-notes

Prerequisites, verification and variations for an exercise.

**Where:** on its own lines · **Inside:** `lab` · **Holds:** Markdown

## lab-setup

Extra setup notes shown for one variant, such as the home lab.

**Where:** on its own lines · **Inside:** `lab` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `variant` | string (id) | yes | The variant these notes are for. |

## lead

The opening paragraph of a page, shown larger than body text.

**Where:** on its own lines · **Holds:** Markdown

## loop-unroller

Unrolls a looped task into the individual runs it produces.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/loop-unroller.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## magic-variables

Shows what each built-in variable holds for a given host.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/magic-variables.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## mode-calculator

Converts between symbolic and numeric file permissions.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/mode-calculator.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## module-explorer

Browses modules by category with their purpose and an example task.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/module-explorer.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## objectives

A boxed list of what the reader will be able to do after the page.

**Where:** on its own lines · **Holds:** Markdown

## play-order

Shows the order a play runs its tasks, roles and handlers.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/play-order.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## play-recap

Explains each part of a play recap line and what the counters mean.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/play-recap.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## practice

A chapter's practice questions, in the quiz format; attempts feed the learning dashboard.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/practice.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of the practice set in the page data. |

## precedence-resolver

Shows which of several competing settings wins when they are toggled on and off.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/precedence-resolver.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## program-cards

A card for each program on the site, with its platform, status and the reader's progress.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`)

## project-tree

A project directory tree with the role of each file explained.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/project-tree.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## quiz

A multiple-choice knowledge check with instant feedback.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/quiz.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string (id) (default `quiz`) |  | Stable id within the page; answers are stored under it. |
| `ref` | string (dataRef) | yes | Key of the question bank in the page data. |
| `title` | string (shortText) |  | Panel title. |
| `objectives` | string[] |  | Objectives the questions check. |

## range-expander

Expands a host range such as web[01:03] into the hosts it names.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/range-expander.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## reader-variables

A form for the reader's own values (declared in program.yml), substituted into code.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`)

## readiness-checklist

A self-assessment checklist that records what you feel ready to do.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/readiness-checklist.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## reuse-simulator

Compares ways of reusing tasks and what each does when the play runs.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/reuse-simulator.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## reveal

A collapsed section the reader opens on demand, such as a solution or hint.

**Where:** on its own lines · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `title` | string (shortText) (default `Show answer`) |  | The toggle label. |

## role-anatomy

A role's directory layout with the purpose of each part.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/role-anatomy.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## role-var-resolver

Resolves a role variable from its defaults, vars and overrides.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/role-var-resolver.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## run-stages

Steps through the stages of a run and where each problem appears.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/run-stages.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## shell-practice

A practice terminal in the browser: try the exercise's commands, with real recorded output, history and Tab completion; tasks tick off as you go.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/shell-practice.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## snapshot-chain

A step-through of lab snapshots and how each one builds on the last.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/snapshot-chain.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## starter-files

Lists an exercise's starter files and lets the reader preview them.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`)

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `exercise` | string (exerciseName) | yes | Exercise name. |

## stat-explorer

Explores the file facts a stat check returns.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/stat-explorer.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## step

One numbered step of a procedure.

**Where:** on its own lines · **Inside:** `steps` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `title` | string (shortText) |  | Step heading. |

## steps

A numbered procedure made of step tags.

**Where:** on its own lines · **Holds:** only `step`

## tab

One view inside a tabs group, with its own label.

**Where:** on its own lines · **Inside:** `tabs` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `label` | string (shortText) | yes | Tab label. |

## tabs

Alternative views of the same idea; the reader picks one.

**Where:** on its own lines · **Holds:** only `tab`

## task

One tracked task in a hands-on exercise.

**Where:** on its own lines · **Inside:** `lab` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string (id) | yes | Stable task id; completion is stored under it. |
| `title` | string (shortText) | yes | Task title. |
| `legacyIndex` | integer (1–) |  | Position in the exercise before ids existed; used to keep old progress. |

## task-outcome

Shows how the failure settings of a task change the result of a run.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/task-outcome.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## template-playground

Renders a template with chosen values to show the output file.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/template-playground.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## term

One glossary entry: a term and its definition.

**Where:** on its own lines · **Inside:** `glossary` · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `name` | string (shortText) | yes | The term. |

## terminal-demo

An animated terminal that types a few commands and shows their output once it scrolls into view.

**Where:** on its own lines · **Inside:** `page` · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/terminal-demo.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of the terminal lines in the page data. |

## variable-name-checker

Tests whether a variable name is valid and says why not.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/variable-name-checker.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## variable-precedence

Ranks the places a variable can be set and shows which one wins.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/variable-precedence.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## variable-substitution

Shows a task before and after its variables are replaced with values.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/variable-substitution.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## variant

Instructions for one variant (declared in program.yml).

**Where:** on its own lines · **Holds:** Markdown

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `name` | string (id) | yes | Variant id from program.yml. |
| `title` | string (shortText) |  | Heading when shown inline. |

## variant-group

Alternative instructions for each variant; the reader sees the one they chose.

**Where:** on its own lines · **Holds:** only `variant`

## variant-switch

The control that switches between variants.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`)

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `label` | string (shortText) |  | Label before the switch. |

## vault-commands

Picks the right vault command for a goal and shows its effect.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/vault-commands.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## verbosity

Shows how output grows as the verbosity level is raised.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/verbosity.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

## yaml-multiline

Shows how each multi-line string style turns into the resulting text.

**Where:** on its own lines · **Holds:** nothing (write it as `/%}`) · **Page data:** `ref` names an entry in the page's `.data.yml`, checked against `data/kits/yaml-multiline.schema.json`

| Attribute | Value | Required | Meaning |
| --- | --- | --- | --- |
| `ref` | string (dataRef) | yes | Key of its words and data in the page data. |

