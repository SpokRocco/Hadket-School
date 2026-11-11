import { useState, useEffect } from 'react';
import { supabase, notifyLocalRealtimeListeners } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '../shared/ImageUpload';

interface Event {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    location: string | null;
    category: string | null;
    image_url: string | null;
    status: string;
}

interface EventFormProps {
    event: Event | null;
    onClose: () => void;
}

export const EventForm = ({ event, onClose }: EventFormProps) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        category: 'general',
        status: 'published',
        image_url: '',
    });
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description || '',
                event_date: event.event_date,
                event_time: event.event_time || '',
                location: event.location || '',
                category: event.category || 'general',
                status: event.status,
                image_url: event.image_url || '',
            });
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.event_date) {
            toast({
                variant: 'destructive',
                title: 'ข้อมูลไม่ครบถ้วน',
                description: 'กรุณากรอกชื่อกิจกรรมและวันที่',
            });
            return;
        }

        try {
            setLoading(true);

            const dataToSave = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                event_date: formData.event_date,
                event_time: formData.event_time || null,
                location: formData.location.trim() || null,
                category: formData.category,
                status: formData.status,
                image_url: formData.image_url || null,
            };

            if (event) {
                // Update existing event
                const { error } = await supabase
                    .from('events')
                    .update(dataToSave)
                    .eq('id', event.id);

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'แก้ไขกิจกรรมเรียบร้อยแล้ว',
                });
            } else {
                // Create new event
                const { error } = await supabase.from('events').insert(dataToSave);

                if (error) throw error;

                toast({
                    title: 'สำเร็จ',
                    description: 'เพิ่มกิจกรรมเรียบร้อยแล้ว',
                });
            }

            notifyLocalRealtimeListeners('events');
            onClose();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'เกิดข้อผิดพลาด',
                description: event ? 'ไม่สามารถแก้ไขกิจกรรมได้' : 'ไม่สามารถเพิ่มกิจกรรมได้',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <Button
                variant="ghost"
                onClick={onClose}
                className="mb-6 gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                กลับ
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{event ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                ชื่อกิจกรรม <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="เช่น วันเปิดเทอม, กีฬาสี"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">รายละเอียด</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="รายละเอียดเกี่ยวกับกิจกรรม..."
                                rows={4}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="event_date">
                                    วันที่ <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="event_date"
                                    type="date"
                                    value={formData.event_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, event_date: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event_time">เวลา</Label>
                                <Input
                                    id="event_time"
                                    type="time"
                                    value={formData.event_time}
                                    onChange={(e) =>
                                        setFormData({ ...formData, event_time: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">สถานที่</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) =>
                                    setFormData({ ...formData, location: e.target.value })
                                }
                                placeholder="เช่น โรงยิมนาเซียม, สนามกีฬา"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">หมวดหมู่</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, category: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">ทั่วไป</SelectItem>
                                        <SelectItem value="academic">วิชาการ</SelectItem>
                                        <SelectItem value="sports">กีฬา</SelectItem>
                                        <SelectItem value="cultural">วัฒนธรรม</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">สถานะ</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="published">เผยแพร่</SelectItem>
                                        <SelectItem value="draft">แบบร่าง</SelectItem>
                                        <SelectItem value="archived">เก็บถาวร</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>รูปภาพกิจกรรม</Label>
                            <ImageUpload
                                currentImage={formData.image_url}
                                onUploadComplete={(url) =>
                                    setFormData({ ...formData, image_url: url })
                                }
                                folder="events"
                                compressionPreset="event"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'กำลังบันทึก...' : event ? 'บันทึกการแก้ไข' : 'เพิ่มกิจกรรม'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                ยกเลิก
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
