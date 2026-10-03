// Classroom vs home-lab instructions. The reader's choice is one site-wide
// preference, so switching it on any page switches every <Env> block.
import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { Link } from '@/lib/router';
import { FileText, House, School, WandSparkles } from 'lucide-react';
import { ENVS, useLabEnv } from '@/lib/labEnv';
import { program } from '@/lib/course';

/** A program without variants has one practice environment, so its exercises show one set of steps. */
const singleEnvironment = () => !program?.variants?.length;
import OptionSwitch from './OptionSwitch';

const icons = { classroom: School, home: House };

export function EnvSwitch({ label = 'Show commands for' }) {
  const [env, setEnv] = useLabEnv();
  return (
    <OptionSwitch
      className="env-switch"
      label={label}
      value={env}
      onChange={setEnv}
      options={ENVS.map(({ id, label: text }) => {
        const Icon = icons[id];
        return {
          value: id,
          label: (
            <>
              <Icon size={13} /> {text}
            </>
          ),
        };
      })}
    />
  );
}

/**
 * <Env>
 *   <Classroom>…what a training classroom does…</Classroom>
 *   <HomeLab>…what to do on the Chapter 1 lab…</HomeLab>
 * </Env>
 */
export function Env({ children }) {
  const [env] = useLabEnv();
  const wanted = env === 'home' ? HomeLab : Classroom;
  const panel = Children.toArray(children).find((c) => isValidElement(c) && c.type === wanted);
  return (
    <div className={`env env-${env}`}>
      <EnvSwitch />
      <div key={env} className="env-panel">
        {panel ? panel.props.children : <p className="env-same">Same as the other environment.</p>}
      </div>
    </div>
  );
}

/** Only meaningful inside <Env>. */
export function Classroom({ children }) {
  return children;
}

/** Inside <Env>: the home-lab panel. On its own: an always-visible note for home-lab readers. */
export function HomeLab({ title = 'On the home lab', children }) {
  return (
    <aside className="callout callout-homelab">
      <div className="callout-icon">
        <House size={16} />
      </div>
      <div className="callout-body">
        <p className="callout-title">{title}</p>
        {children}
      </div>
    </aside>
  );
}

function parseManifest(text) {
  const files = [];
  // The exercise page notes that some files are created on the workstation when a header comment says so.
  let hook = /^#\s*generated:/m.test(text);
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    if (line.startsWith('@')) hook = true;
    else {
      const [dest, src = dest] = line.split('=');
      files.push({ dest, src });
    }
  }
  return { files, hook };
}

/** Lists what the home-lab `lab start NAME` creates; click a file to read it. */
export function StarterFiles({ name }) {
  const [manifest, setManifest] = useState(null);
  const [open, setOpen] = useState(null);
  const [body, setBody] = useState('');
  const base = `${import.meta.env.BASE_URL}lab/${name}/`;
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), [base]);

  useEffect(() => {
    let alive = true;
    setManifest(null);
    setOpen(null);
    const controller = new AbortController();
    fetch(`${base}MANIFEST`, { signal: controller.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Download failed'))))
      .then((t) => alive && setManifest(t.trimStart().startsWith('<') ? false : parseManifest(t)))
      .catch(() => alive && setManifest(false));
    return () => {
      alive = false;
      controller.abort();
    };
  }, [base]);

  const show = (file) => {
    request.current?.abort();
    if (open === file.dest) return setOpen(null);
    const controller = new AbortController();
    request.current = controller;
    setOpen(file.dest);
    setBody('Loading…');
    fetch(base + file.src, { signal: controller.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Download failed'))))
      .then(setBody)
      .catch((error) => {
        if (error.name !== 'AbortError') setBody('Could not load this file. Check your connection and try again.');
      });
  };

  if (manifest === null) return null;
  if (manifest === false)
    return <p className="starter-none">The starter files could not be loaded. Check your connection and reload this page.</p>;
  if (!manifest.files.length && !manifest.hook)
    return <p className="starter-none">An empty project folder: you write every file yourself.</p>;

  return (
    <div className="starter">
      <ul className="starter-files">
        {manifest.files.map((f) => (
          <li key={f.dest}>
            <button className={open === f.dest ? 'is-active' : ''} onClick={() => show(f)} aria-expanded={open === f.dest}>
              <FileText size={12} /> {f.dest}
            </button>
          </li>
        ))}
        {manifest.hook && (
          <li
            className="starter-hook"
            title="Some files are generated on your workstation, for example certificates or Vault-encrypted files"
          >
            <WandSparkles size={12} /> plus generated files
          </li>
        )}
      </ul>
      {open && (
        <pre className="starter-view" tabIndex={0}>
          <code>{body}</code>
        </pre>
      )}
    </div>
  );
}

/** The "Finish" step of an exercise, for both environments. */
export function Finish({ name, grade = false }) {
  if (singleEnvironment())
    return (
      <p className="lab-finish">
        {grade ? (
          <>
            On workstation, check your work with <code>lab grade {name}</code>. Fix anything that fails and grade again; grading only reads.
            Then{' '}
          </>
        ) : (
          'On workstation, '
        )}
        <code>lab finish {name}</code> moves the exercise folder to <code>~/lab-archive/</code>, and on the Ubuntu host{' '}
        <code>rht-vmctl reset servers</code> returns the servers to their clean state for the next exercise.
      </p>
    );
  return (
    <Env>
      <Classroom>
        <p>
          On workstation, {grade && 'grade your work, then '}clean up so this exercise does not affect the next one:{' '}
          {grade && (
            <>
              <code>lab grade {name}</code>, then{' '}
            </>
          )}
          <code>lab finish {name}</code>.
        </p>
      </Classroom>
      <HomeLab>
        <p>
          Two steps. On workstation, <code>lab finish {name}</code> moves your project to <code>~/lab-archive/</code> (add{' '}
          <code>--delete</code> to remove it instead). Then, on the Ubuntu host, <code>rht-vmctl reset servers</code> puts every managed
          host back to the clean baseline; <code>lab</code> cannot do that part from inside the lab network.
          {grade && (
            <>
              {' '}
              Run <code>lab grade {name}</code> before finishing. Also repeat your playbook and inspect unexpected changes; deliberate
              restarts and commands may still report changes.
            </>
          )}
        </p>
      </HomeLab>
    </Env>
  );
}

/** Inside <Lab>: extra home-lab preparation notes, shown in the Home lab tab of the exercise header. */
export function HomeSetup({ children }) {
  return children;
}

export function LabPrep({ name, classroom, starter, own, extra }) {
  const [env] = useLabEnv();
  const guide = `/${program?.labGuide ?? 'ch01/control-node'}`;
  if (singleEnvironment())
    return (
      <div className="lab-prep">
        <p className="lab-meta-label">Before you begin</p>
        <ol className="lab-prep-steps">
          <li>
            On the Ubuntu host: <code>rht-vmctl reset servers</code> (start from clean servers).
          </li>
          <li>
            On workstation: <code>{classroom}</code>. The <Link to={guide}>lab command</Link> creates <code>~/{name}</code>
            {starter ? ' with the exercise brief and these files:' : '.'}
            {starter && <StarterFiles name={name} />}
          </li>
        </ol>
        {extra}
      </div>
    );
  return (
    <div className={`env env-${env} lab-prep`}>
      <div className="lab-prep-head">
        <p className="lab-meta-label">Before you begin</p>
        <EnvSwitch />
      </div>
      <div className="env-panel">
        {env === 'classroom' ? (
          own ? (
            <p>
              This exercise is this guide's own, so a classroom <code>lab</code> command does not know it. Create <code>~/{name}</code> on
              workstation yourself and copy in the starter files listed under <em>Home lab</em>; they use the usual classroom host names.
            </p>
          ) : (
            <p>
              As <code>student</code> on workstation, run <code>{classroom}</code>. It creates <code>~/{name}</code> with the exercise's
              starter files and prepares the managed hosts.
            </p>
          )
        ) : (
          <>
            <ol className="lab-prep-steps">
              <li>
                On the Ubuntu host: <code>rht-vmctl reset servers</code> (start from clean machines).
              </li>
              {starter && (
                <li>
                  On workstation: <code>{classroom}</code>
                  {!own && ', the same command as in a classroom'}. The <Link to={guide}>home-lab lab command</Link> creates{' '}
                  <code>~/{name}</code> with these starter files:
                  <StarterFiles name={name} />
                </li>
              )}
            </ol>
            {extra}
          </>
        )}
      </div>
    </div>
  );
}
