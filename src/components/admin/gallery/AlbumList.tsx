import { useState } from 'react';
import { Image, Edit, Trash2, Eye, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { Album } from './GalleryManagement';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface AlbumListProps {
    albums: Album[];
    onEdit: (album: Album) => void;
    onDelete: (id: string) => void;
    onTogglePublish: (album: Album) => void;
    onManagePhotos: (album: Album) => void;
}

export const AlbumList = ({
    albums,
    onEdit,
    onDelete,
    onTogglePublish,
    onManagePhotos,
}: AlbumListProps) => {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDeleteConfirm = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-border"
                    >
                        {/* Cover Photo */}
                        {album.cover_photo_url ? (
                            <div className="h-48 overflow-hidden">
                                <img
                                    src={album.cover_photo_url}
                                    alt={album.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                            </div>
                        ) : (
                            <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                                <Image className="w-16 h-16 text-muted-foreground" />
                            </div>
                        )}

                        {/* Album Info */}
                        <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-lg text-foreground line-clamp-2 flex-1">
                                    {album.title}
                                </h3>
                                {album.is_published ? (
                                    <Badge className="bg-green-500 ml-2">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        เผยแพร่
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="ml-2">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        ซ่อน
                                    </Badge>
                                )}
                            </div>

                            {album.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {album.description}
                                </p>
                            )}

                            <div className="space-y-2 mb-4">
                                {album.category && (
                                    <Badge variant="outline" className="text-xs">
                                        {album.category}
                                    </Badge>
                                )}

                                {album.event_date && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(album.event_date), 'dd MMM yyyy', { locale: th })}
                                    </div>
                                )}

                                {album.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="w-3 h-3" />
                                        {album.location}
                                    </div>
                                )}

                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Image className="w-3 h-3" />
                                    {album.photo_count || 0} รูป
                                </div>

                                {album.google_drive_url && (
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                        <span>📁 Google Drive เชื่อมต่อแล้ว</span>
                                    </div>
                                )}

                                {album.google_photos_url && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                                        <span>📷 Google Photos เชื่อมต่อแล้ว</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onManagePhotos(album)}
                                    className="flex-1"
                                >
                                    <Image className="w-4 h-4 mr-1" />
                                    จัดการรูป
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onTogglePublish(album)}
                                    title={album.is_published ? 'ซ่อน' : 'เผยแพร่'}
                                >
                                    {album.is_published ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onEdit(album)}
                                    title="แก้ไข"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setDeleteId(album.id)}
                                    title="ลบ"
                                >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="ยืนยันการลบอัลบั้ม"
                description="คุณแน่ใจหรือไม่ว่าต้องการลบอัลบั้มนี้? รูปภาพทั้งหมดในอัลบั้มจะถูกลบด้วย การดำเนินการนี้ไม่สามารถย้อนกลับได้"
            />
        </>
    );
};
