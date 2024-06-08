import Image from 'next/image'
import PlaceholderClientLogo from '../components/placeholders/placeholderClientLogo'
import Section from '../components/section/section'
import SectionContent from '../components/section/sectionContent'
import styles from './clientLogos.module.css'

const clientLogoInfo = [
  {
    label: 'Deloitte',
    image: '/images/clients/deloitte-logo-black-alt.png',
    link: 'https://www2.deloitte.com/ca/en/pages/about-deloitte/articles/home.html?icid=site_selector_ca',
  },
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
    label: 'GMet',
    image: '/images/clients/logo-gmet.png',
    link: 'https://generalmetabolics.com/',
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
  else if (ClientLogo.label == "Trendline")
  {
    cardStyle = styles.trendlineCard;
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
    <SectionContent>
      <p>Our clients consist of Fortune 500 companies and start-ups across several industries: Healthcare, Fintech, NGOs, Solar Power, Oil & Gas, Integrated Circuits, and more.</p>
      <p>Here are some of our current and former clients:</p>
    </SectionContent>
    </center>
    <div className={styles.cardList}>{clientLogoInfo.map((ClientLogo, i) => displayClientLogo(ClientLogo, i))}</div>
  </Section>
)

export default ClientLogos
