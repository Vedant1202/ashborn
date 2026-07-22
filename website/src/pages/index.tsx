import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const signals = [
  {
    name: 'tool-definition-drift',
    auc: '1.000',
    note: 'The one precise, shipped detector — measured on a synthetic corpus.',
  },
  {
    name: 'tool-output-injection',
    auc: '0.817',
    note: 'Reproduces the known over-defense failure; the retrained model is gated.',
  },
  {
    name: 'untrusted-data-egress',
    auc: '0.603',
    note: 'A risk annotation, not an alert — the lethal trifecta is ordinary agent work.',
  },
];

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Agent-security visibility"
      description="See what your AI agents access, call, and send. An open, reproducible benchmark for agent-security signals — and the one detector that survived it."
    >
      <header className="heroBanner">
        <img className="heroLogo" src={useBaseUrl('/img/logo-dark.svg')} alt="Ashborn" />
        <h1 className="heroTitle">ashborn</h1>
        <p className="heroTagline">{siteConfig.tagline}</p>
        <div className="heroButtons">
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get started
          </Link>
          <Link
            className="button button--secondary button--lg"
            href="https://github.com/Vedant1202/ashborn"
          >
            GitHub
          </Link>
        </div>
      </header>
      <main>
        <section className="results">
          <h2>Results, scored on 790 labeled agent traces</h2>
          <p>Every number reproduces from a clean clone — offline, deterministic, no API key.</p>
          <div className="resultsGrid">
            {signals.map((signal) => (
              <div className="resultCard" key={signal.name}>
                <h3>{signal.name}</h3>
                <div className="resultAuc">AUC {signal.auc}</div>
                <div className="resultNote">{signal.note}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
