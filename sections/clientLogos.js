import Image from 'next/image'
import PlaceholderClientLogo from '../components/placeholders/placeholderClientLogo'
import Section from '../components/section/section'
import styles from './clientLogos.module.css'

const clientLogoInfo = [
  {
    label: 'Trendline',
    image: '/images/clients/logo-trendline.png',
    link: 'https://www.trendlineinsights.com/',
  },
  {
    label: 'CarbonTracker',
    image: '/images/clients/logo-ct.png',
    link: 'https://carbontracker.org/',
  },
  {
    label: 'Healthcare Integrative Solutions',
    image: '/images/clients/logo-his.png',
    link: 'https://healthcareintegrative.com/',
  },
  {
    label: 'Home Nursing and Therapy Services',
    image: '/images/clients/logo-hnts.png',
    link: 'https://www.hnts.org/',
  },
  {
    label: 'Deloitte',
    image: '/images/clients/deloitte-logo-black-alt.png',
    link: 'https://www2.deloitte.com/ca/en/pages/about-deloitte/articles/home.html?icid=site_selector_ca',
  },
]

function displayClientLogo(ClientLogo, i) {
  let image = null
  if (ClientLogo.image) {
    image = <Image src={ClientLogo.image} width="100%" height="100%" layout="responsive" objectFit="contain" />
  } else {
    image = <PlaceholderClientLogo />
  }

  let cardStyle;
  if (ClientLogo.label == "Deloitte") {
    cardStyle = styles.dimCard;
  }
  else {
    cardStyle = styles.card;
  }

  return (
    <a key={i} href={ClientLogo.link} target="_blank">
      <div className={cardStyle}>{image}</div>
    </a>
  )
}

const ClientLogos = () => (
  <Section id="clientlogos">
    <center>
      <h5>The Company We Keep</h5>
      <p>Some of our current and former clients.</p>
    </center>
    <div className={styles.cardList}>{clientLogoInfo.map((ClientLogo, i) => displayClientLogo(ClientLogo, i))}</div>
  </Section>
)

export default ClientLogos
