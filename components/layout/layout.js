import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './layout.module.css'

const NavLinkInfo = [
  {
    name: 'About',
    path: '/#about',
  },
  {
    name: 'Services',
    path: '/#services',
  },
  {
    name: 'Team',
    path: '/#team',
  },
  {
    name: 'Portfolio',
    path: '/#portfolio',
  },
  {
    name: 'Blog',
    path: '/blog',
  },
  {
    name: 'Contact',
    path: '/#contact',
  },
]

const SocialMediaIconInfo = [
  {
    name: 'LinkedIn',
    link: 'https://www.linkedin.com/company/zyphr-solutions-inc/',
    image: '/images/icons/social-linkedin.svg',
  },
  {
    name: 'Medium',
    link: 'https://medium.com/zyphr-solutions',
    image: '/images/icons/social-medium.svg',
  },
  {
    name: 'GitHub',
    link: 'https://github.com/zyphr-solutions/',
    image: '/images/icons/social-github.svg',
  },
]

const Layout = (props) => {
  const [showModal, setShowModal] = useState(false)

  const logoContent = (
    (<Link href="/">

      <div className={styles.logo}>
        <Image src={'/images/logos/logo-name-black.svg'} layout="fill" objectFit="contain" objectPosition="left" />
      </div>

    </Link>)
  )

  const navContent = (
    <nav>
      <ul>
        {NavLinkInfo.map((navLink, i) => (
          <li key={i}>
            <Link href={navLink.path} onClick={() => setShowModal(false)}>
              {navLink.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
  const navBar = <div className={styles.navbar}>{navContent}</div>

  const navToggle = (
    <div className={styles.navtoggle} onClick={() => setShowModal(!showModal)}>
      {showModal ? <div>✕</div> : null}
      {!showModal ? <div>☰</div> : null}
    </div>
  )

  const navModal = <div className={styles.navmodal}>{navContent}</div>

  const emailContent = (
    <div>
      <a style={{visibility: "hidden"}} href="mailto:zyphr.form@gmail.com">zyphr.form@gmail.com</a>
    </div>
  )

  const socialContent = (
    <div className={styles.icons}>
      {SocialMediaIconInfo.map((SocialMediaIcon, i) => (
        <a key={i} href={SocialMediaIcon.link} target="_blank">
          <div className={styles.icon}>
            <Image src={SocialMediaIcon.image} alt={SocialMediaIcon.name} layout="fill" objectFit="contain" objectPosition="right" />
          </div>
        </a>
      ))}
    </div>
  )

  // const handleScrollBottom = (e) => {
  //   if (e.target.scrollTop() < 100) {
  //     e.target.fadeOut(1000)
  //   } else {
  //     e.target.fadeIn(1000)
  //   }
  // }
  // const currentYear = new Date().getFullYear()
  // const copyrightContent = (
  //   <div onScroll={handleScrollBottom}>
  //     <p>© {currentYear} Zyphr Solutions Inc. All Rights Reserved.</p>
  //     <p>Coded with 💛 by Aanika Rahman</p>
  //   </div>
  // )

  return (
    <div>
      <header className={styles.header}>
        {logoContent}
        {navBar}
        {navToggle}
      </header>
      <main className={styles.main}>
        {showModal ? <div>{navModal}</div> : null}
        {!showModal ? <div>{props.children}</div> : null}
      </main>
      <footer className={styles.footer}>
        {emailContent}
        {socialContent}
      </footer>
    </div>
  )
}

export default Layout
