import Layout from '../components/layout/layout'
import Meta from '../components/meta'
import Landing from '../sections/landing'
import ClientLogos from '../sections/clientLogos'
import Services from '../sections/services'
import About from '../sections/about'
import Team from '../sections/team'
import Portfolio from '../sections/portfolio'
import ClientTestimonials from '../sections/clientTestimonials'
import Contact from '../sections/contact'
import Script from 'next/script'

import { getAllPostData } from '../utils/mdx'

export const getStaticProps = async () => {
  const portfolioPosts = getAllPostData('portfolio').filter(
    // covid 19 app temporarily hidden from carousel
    (post) => post.slug !== 'a-covid-app'
  )
  return {
    props: {
      portfolioPosts,
    },
  }
}

const Index = ({ portfolioPosts }) => (
  <Layout>
    <Meta />
    <Landing />
    <About />
    <Services />
    <Team />
    <Portfolio posts={portfolioPosts} />
    <ClientTestimonials />
    <ClientLogos />
    <Contact />
    <Script id="show-banner">
{`

let landingPage = document.getElementById("landing-page");
let ctaBtn = document.getElementById("cta-button-landing-page");

landingPage.addEventListener("mousemove", (e) => {
  let bounds = landingPage.getBoundingClientRect();
  let x = event.clientX - bounds.left;
  let y = event.clientY - bounds.top;

  let subX = x / bounds["width"];
  subX = subX.toFixed(2);

  const leftHue = 77;
  const rightHue = 176;
  const delta = rightHue - leftHue;

  let newLeftHue = leftHue + subX * delta;
  let newRightHue = rightHue - subX * delta;
  newLeftHue = parseInt(newLeftHue);
  newRightHue = parseInt(newRightHue);

  // update the color gradient in the background
  let firstBkgdImg = "linear-gradient(to right, hsl(" + newLeftHue + ", 22%, 87%), hsl(" + newRightHue + ", 40%, 87%))";
  landingPage.style.backgroundImage = firstBkgdImg;

  // update the drop shadow of the cta button
  let boxShadowLeft = 4 - subX * 8;
  ctaBtn.style.boxShadow = boxShadowLeft + "px 4px 0 #000";
})

`}
    </Script>
  </Layout>
)

export default Index
