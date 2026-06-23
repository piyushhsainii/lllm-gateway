import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import BenchStrip from '@/components/BenchStrip'
import Integration from '@/components/Integration'
import Pipeline from '@/components/Pipeline'
import Fallback from '@/components/Fallback'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BenchStrip />
        <Integration />
        <hr className="section-divider" />
        <Pipeline />
        <Fallback />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
