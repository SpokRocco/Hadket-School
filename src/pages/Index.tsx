import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import NewsSection from '@/components/NewsSection';
import CurriculumSection from '@/components/CurriculumSection';
import AdministratorsSection from '@/components/AdministratorsSection';
import MediaLibrarySection from '@/components/MediaLibrarySection';
import NewsletterSection from '@/components/NewsletterSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import WelcomePopupModal from '@/components/WelcomePopupModal';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import type { HomepageSectionId } from '@/utils/homepageLayoutUtils';

const Index = () => {
  const { settings } = useSchoolSettings();

  const sectionRegistry: Record<HomepageSectionId, ReactNode> = {
    hero: <HeroSection />,
    about: <AboutSection />,
    news: <NewsSection />,
    curriculum: <CurriculumSection />,
    administrators: <AdministratorsSection />,
    media: <MediaLibrarySection />,
    newsletter: <NewsletterSection />,
    contact: <ContactSection />,
  };

  const orderedEnabledSections = settings.homepageSections.filter((s) => s.enabled);

  return (
    <div className="min-h-screen bg-background">
      {/* Arrival Announcement Popup Modal (Admin Configurable) */}
      <WelcomePopupModal />

      <Navbar />
      <main className="pt-20">
        {orderedEnabledSections.map((section) => (
          <div key={section.id} data-homepage-section={section.id}>
            {sectionRegistry[section.id]}
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
