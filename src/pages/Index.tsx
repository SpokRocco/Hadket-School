import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AdministratorsSection from '@/components/AdministratorsSection';
import AboutSection from '@/components/AboutSection';
import NewsSection from '@/components/NewsSection';
import NewsletterSection from '@/components/NewsletterSection';
import CurriculumSection from '@/components/CurriculumSection';
import MediaLibrarySection from '@/components/MediaLibrarySection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <AdministratorsSection />
        <AboutSection />
        <NewsSection />
        <NewsletterSection />
        <CurriculumSection />
        <MediaLibrarySection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
