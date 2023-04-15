import Image from 'next/image'
import Link from 'next/link'
import Section from '../components/section/section'

const Landing = () => (
  <Section id="landing-page">
    <div className="row no-gutters">
      <div id="landing-page-logo-box" className="col-lg-5 col-md-12 col-sm-12">
          <Image
            className="landing-page-logo"
            src={'/images/logos/logo-textured-with-backdrop.svg'}
            alt="logo"
            layout="fill"
            objectPosition="right"
          />
      </div>

      <div className="col-lg-7 col-md-12 col-sm-12">
        <h2>Dash Apps by the Experts</h2>
        <p style={{fontSize: '1.5rem'}}>
          Building out your vision with interdisciplinary precision and a <span className="highlighted-text">dash</span> of creativity.
        </p>
        <br />
        <br />
        <h2>
          <Link href="#contact">
            <a id="cta-button-landing-page" className="cta-button-landing-page">Get in touch</a>
          </Link>
        </h2>
      </div>
    </div>
  </Section>
)

export default Landing
