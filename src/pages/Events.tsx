import { useState, useEffect, useCallback } from 'react';
import { supabase, subscribeToRealtimeTables } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    location: string | null;
    category: string | null;
    image_url: string | null;
}

const Events = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('status', 'published')
                .gte('event_date', new Date().toISOString().split('T')[0])
                .order('event_date', { ascending: true })
                .limit(20);

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        return subscribeToRealtimeTables(
            'realtime_events_page',
            ['events'],
            fetchEvents
        );
    }, [fetchEvents]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
        });
    };

    const getCategoryBadge = (category: string | null) => {
        const categories: Record<string, { label: string; color: string }> = {
            academic: { label: 'วิชาการ', color: 'bg-blue-500' },
            sports: { label: 'กีฬา', color: 'bg-green-500' },
            cultural: { label: 'วัฒนธรรม', color: 'bg-purple-500' },
            general: { label: 'ทั่วไป', color: 'bg-gray-500' },
        };

        const cat = categories[category || 'general'] || categories.general;
        return (
            <span className={`px-3 py-1 rounded-full text-xs text-white ${cat.color}`}>
                {cat.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 pt-20">
            {/* Hero Section */}
            <section className="bg-primary py-20">
                <div className="container mx-auto px-4 text-center">
                    <span className="inline-block text-accent font-semibold mb-4">กิจกรรมและปฏิทิน</span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                        ปฏิทิน<span className="text-accent">กิจกรรม</span>
                    </h1>
                    <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
                        ติดตามกิจกรรมและเหตุการณ์สำคัญของโรงเรียน
                    </p>
                </div>
            </section>

            {/* Events List */}
            <section className="section-padding bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">

                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">กำลังโหลด...</p>
                            </div>
                        ) : events.length === 0 ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-xl font-semibold mb-2">ยังไม่มีกิจกรรมที่จะเกิดขึ้น</h3>
                                    <p className="text-muted-foreground">
                                        โปรดติดตามกิจกรรมใหม่ ๆ ในอนาคต
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {events.map((event) => (
                                    <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <div className="md:flex">
                                            {event.image_url && (
                                                <div className="md:w-1/3">
                                                    <img
                                                        src={event.image_url}
                                                        alt={event.title}
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className={event.image_url ? 'md:w-2/3' : 'w-full'}>
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CardTitle className="text-2xl">{event.title}</CardTitle>
                                                                {getCategoryBadge(event.category)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    {event.description && (
                                                        <p className="text-muted-foreground mb-4">
                                                            {event.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(event.event_date)}
                                                        </div>
                                                        {event.event_time && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4" />
                                                                เวลา {event.event_time} น.
                                                            </div>
                                                        )}
                                                        {event.location && (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4" />
                                                                {event.location}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
            </main>

            <Footer />
        </div>
    );
};

export default Events;
