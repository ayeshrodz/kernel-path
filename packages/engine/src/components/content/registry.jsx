// Maps catalog tags (the content contract) to engine components. Content refers to tags
// by name with typed attributes; how each tag renders is entirely the engine's choice, so
// components can be rewritten or upgraded without touching content.
import { lazy } from 'react';
import Callout from '@/components/prose/Callout';
import { Card, Cards, Column, Columns, Glossary, Lead, Objectives, Reveal, Step, Steps, Tab, Tabs, Term } from '@/components/prose/Layout';
import Quiz from '@/components/interactive/Quiz';
import Flashcards from '@/components/interactive/Flashcards';
import AssessmentTimer from '@/components/interactive/AssessmentTimer';
import { Lab, LabChallenge, LabNotes, Task } from '@/components/interactive/Lab';
import { Classroom, Env, EnvSwitch, Finish, HomeLab, HomeSetup, StarterFiles } from '@/components/interactive/Env';
import { lazyWidget } from '@/components/interactive/LazyWidget';
import ProgramCards from './ProgramCards';
import Hero from '@/components/landing/Hero';
import FeatureGrid from '@/components/landing/FeatureGrid';
import TerminalDemo from '@/components/landing/TerminalDemo';
import SpecDiagram from './SpecDiagram';
import chapterWidgets from 'virtual:chapter-widgets';

/** Kits are interactive teaching components, each with a catalog tag of its own (LoopUnroller is loop-unroller). */
const kitTag = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const kits = Object.fromEntries(
  Object.entries(chapterWidgets)
    .filter(([name]) => name !== 'LabValues')
    .map(([name, kit]) => [kitTag(name), kit]),
);
/** The component name behind a kit tag, which is the key its words are stored under. */
export const kitNames = Object.fromEntries(Object.keys(chapterWidgets).map((name) => [kitTag(name), name]));

const FlowMap = lazyWidget(() => import('@/components/interactive/FlowMap'));
const ChapterPractice = lazyWidget(() => import('@/components/interactive/ChapterPractice'));

/**
 * Each entry turns a tag's attributes, its page data and the page context into a
 * component and props. Unknown tags have no entry and render nothing.
 */
export const tags = {
  lead: () => [Lead],
  objectives: () => [Objectives],
  callout: (a) => [Callout, { type: a.type, title: a.title }],
  cards: (a) => [Cards, { cols: a.cols }],
  card: (a) => [Card, { title: a.title, kicker: a.kicker, tone: a.tone }],
  columns: () => [Columns],
  column: (a) => [Column, { title: a.title, tone: a.tone }],
  tabs: () => [Tabs],
  tab: (a) => [Tab, { label: a.label }],
  reveal: (a) => [Reveal, { title: a.title }],
  steps: () => [Steps],
  step: (a) => [Step, { title: a.title }],
  glossary: () => [Glossary],
  term: (a) => [Term, { name: a.name }],
  kbd: () => ['kbd'],
  'program-cards': () => [ProgramCards],
  hero: (a) => [
    Hero,
    { eyebrow: a.eyebrow, title: a.title, primary: a.primary, primaryLabel: a.primaryLabel, secondaryLabel: a.secondaryLabel },
  ],
  'feature-grid': (a, data) => [FeatureGrid, { items: data.items }],
  'terminal-demo': (a, data) => [TerminalDemo, { title: data.title, lines: data.lines }],
  diagram: (a, data) => [SpecDiagram, { spec: data }],

  quiz: (a, data) => [Quiz, { id: a.id, title: a.title, questions: data.questions }],
  practice: (a, data, page) => [
    ChapterPractice,
    { chapter: page.chapterId, challenges: data.questions.map((q) => ({ ...q, chapter: page.chapterId })) },
  ],
  flashcards: (a, data) => [Flashcards, { title: a.title, cards: data.cards }],
  'assessment-timer': (a) => [AssessmentTimer, { id: a.id, minutes: a.minutes }],
  lab: (a) => [
    Lab,
    {
      id: a.id,
      title: a.title,
      outcomes: a.outcomes,
      hosts: a.hosts,
      starter: a.starter,
      own: a.ownExercise,
      classroom: a.exercise ? `lab start ${a.exercise}` : undefined,
    },
  ],
  task: (a) => [Task, { id: a.id, title: a.title }],
  'lab-notes': () => [LabNotes],
  'lab-challenge': () => [LabChallenge],
  'lab-setup': () => [HomeSetup],
  'lab-finish': (a) => [Finish, { name: a.exercise, grade: a.grade, servers: a.servers }],
  'starter-files': (a) => [StarterFiles, { name: a.exercise }],

  'variant-group': () => [Env],
  variant: (a) => (a.name === 'classroom' ? [Classroom] : [HomeLab, { title: a.title }]),
  'variant-switch': (a) => [EnvSwitch, { label: a.label }],
  'reader-variables': () => [chapterWidgets.LabValues],

  'flow-map': (a, data) => [FlowMap, { title: a.title, caption: a.caption, steps: data.steps, connections: data.connections }],
  ...Object.fromEntries(Object.entries(kits).map(([tag, kit]) => [tag, (a, data) => [kit, data.props ?? {}]])),
};

/** Strip undefined props so components keep their own defaults. */
export function cleanProps(props) {
  return props ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) : {};
}
