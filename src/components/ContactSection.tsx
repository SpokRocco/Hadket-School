import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Youtube, Instagram, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';



const ContactSection = () => {
  const { toast } = useToast();
  const { settings } = useSchoolSettings();

  const contactInfo = [
    {
      icon: MapPin,
      title: 'ที่อยู่',
      content: settings.contact_address,
    },
    {
      icon: Phone,
      title: 'โทรศัพท์',
      content: settings.contact_phone,
    },
    {
      icon: Mail,
      title: 'อีเมล',
      content: settings.contact_email,
    },
    {
      icon: Clock,
      title: 'เวลาทำการ',
      content: settings.contact_hours || 'จันทร์ - ศุกร์ 07:30 - 16:30 น.',
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: settings.social_facebook || '#', label: 'Facebook', show: !!settings.social_facebook },
    { icon: Youtube, href: settings.social_youtube || '#', label: 'Youtube', show: !!settings.social_youtube },
    { icon: Instagram, href: settings.social_instagram || '#', label: 'Instagram', show: !!settings.social_instagram },
  ];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'ส่งข้อความสำเร็จ',
      description: 'เราได้รับข้อความของคุณแล้ว จะติดต่อกลับโดยเร็วที่สุด',
    });
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  return (
    <section id="contact" className="section-padding bg-background">
      <div className="container-school">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-accent font-semibold mb-4">ติดต่อเรา</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            พร้อมให้<span className="text-primary">บริการ</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            มีคำถามหรือต้องการข้อมูลเพิ่มเติม? ติดต่อเราได้ทุกช่องทาง
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <div className="bg-primary rounded-3xl p-8 md:p-10 mb-8">
              <h3 className="text-2xl font-bold text-primary-foreground mb-8">ข้อมูลติดต่อ</h3>
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary-foreground mb-1">{item.title}</h4>
                      <p className="text-primary-foreground/80">{item.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-10 pt-8 border-t border-primary-foreground/20">
                <h4 className="font-semibold text-primary-foreground mb-4">ติดตามเรา</h4>
                <div className="flex gap-3 flex-wrap">
                  {settings.social_links && settings.social_links.length > 0 ? (
                    settings.social_links.map((link, index) => {
                      const getSocialIcon = (platform: string) => {
                        switch (platform) {
                          case 'facebook': return Facebook;
                          case 'youtube': return Youtube;
                          case 'instagram': return Instagram;
                          case 'line': return MessageCircle; // Unfortunately Lucide doesn't have Line icon, using MessageCircle
                          default: return LinkIcon;
                        }
                      };
                      const Icon = getSocialIcon(link.platform);

                      // Assign colors based on platform
                      const getColor = (platform: string) => {
                        switch (platform) {
                          case 'facebook': return 'hover:bg-blue-600';
                          case 'youtube': return 'hover:bg-red-600';
                          case 'instagram': return 'hover:bg-pink-600';
                          case 'line': return 'hover:bg-green-500';
                          default: return 'hover:bg-accent';
                        }
                      }

                      return (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={link.platform}
                          className={`w-11 h-11 rounded-xl bg-primary-foreground/10 flex items-center justify-center text-primary-foreground ${getColor(link.platform)} hover:text-white transition-colors`}
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      );
                    })
                  ) : (
                    <p className="text-sm text-primary-foreground/80">ติดตามข้อมูลข่าวสารได้เร็วๆ นี้</p>
                  )}
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-card rounded-2xl overflow-hidden shadow-lg border border-border h-64">
              {settings.google_maps_embed ? (
                <iframe
                  src={settings.google_maps_embed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`แผนที่${settings.school_name}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <p className="text-muted-foreground">กรุณาตั้งค่า Google Maps ใน Admin Settings</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-3xl p-8 md:p-10 shadow-lg border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-8">ส่งข้อความถึงเรา</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    ชื่อ-นามสกุล *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="กรอกชื่อ-นามสกุล"
                    required
                    className="h-12"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    เบอร์โทรศัพท์
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0XX-XXX-XXXX"
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  อีเมล *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                  เรื่อง *
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="หัวข้อที่ต้องการติดต่อ"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  ข้อความ *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="รายละเอียดที่ต้องการสอบถาม..."
                  required
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 h-14 gap-2"
              >
                <Send className="w-5 h-5" />
                ส่งข้อความ
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
