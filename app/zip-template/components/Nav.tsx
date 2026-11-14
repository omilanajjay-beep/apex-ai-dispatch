import React from 'react';
import styles from './Nav.module.css';

interface NavProps {
  navRef: React.Ref<HTMLElement>;
}

export const Nav: React.FC<NavProps> = ({ navRef }) => {
  return (
    <nav ref={navRef} className={styles.nav}>
      <a href="#" className={styles.logoLink} aria-label="Apex AI Home">
        <img src="https://assets.uberdesigner.ai/easylog/logo.svg" alt="Apex AI Logo" className={styles.logoImg} />
      </a>
      
      <div className={styles.linkPill}>
        <a href="#">Systems</a>
        <a href="#">Platform</a>
        <a href="#">Dispatch</a>
        <a href="#">Telemetry</a>
        <a href="#">Integrations</a>
        <a href="#">Journal</a>
        <a href="#">Contact</a>
      </div>

      <button className={styles.menuBtn} type="button">menu</button>
    </nav>
  );
};
