import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Edit,
  Trash2,
  Eye,
  GripVertical,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { NewsItem } from './NewsManagement';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface NewsListProps {
  items: NewsItem[];
  onEdit: (item: NewsItem) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (item: NewsItem) => void;
  onReorder: (items: NewsItem[]) => void;
}

const SortableNewsItem = ({
  item,
  index,
  total,
  onEdit,
  onDelete,
  onTogglePublish,
  onMoveUp,
  onMoveDown,
}: {
  item: NewsItem;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md transition-all"
    >
      {/* Drag Handle & Order Controls */}
      <div className="flex items-center gap-1.5">
        <div
          {...attributes}
          {...listeners}
          title="ลากเพื่อจัดลำดับ"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            title="เลื่อนขึ้น"
            className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={onMoveDown}
            title="เลื่อนลง"
            className="p-1 rounded border border-border hover:bg-secondary disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Order Badge */}
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
        #{index + 1}
      </div>

      {/* Thumbnail */}
      {item.cover_image_url ? (
        <img
          src={item.cover_image_url}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-20 h-20 object-cover rounded-lg shrink-0"
        />
      ) : (
        <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center shrink-0">
          <span className="text-2xl text-muted-foreground">📰</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
          {item.is_pinned && (
            <Badge variant="secondary" className="text-xs shrink-0">
              ปักหมุด
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.excerpt}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {item.views} ครั้ง
          </span>
          <Badge variant="outline" className="text-xs">
            {item.category}
          </Badge>
          {item.published_at && (
            <span>{format(new Date(item.published_at), 'dd MMM yyyy', { locale: th })}</span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 shrink-0">
        {item.published ? (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            เผยแพร่แล้ว
          </Badge>
        ) : (
          <Badge variant="secondary">
            <XCircle className="w-3 h-3 mr-1" />
            ฉบับร่าง
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTogglePublish}
          title={item.published ? 'ยกเลิกการเผยแพร่' : 'เผยแพร่'}
        >
          {item.published ? 'ซ่อน' : 'เผยแพร่'}
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onEdit} title="แก้ไข">
          <Edit className="w-4 h-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onDelete} title="ลบ">
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export const NewsList = ({ items, onEdit, onDelete, onTogglePublish, onReorder }: NewsListProps) => {
  const [localItems, setLocalItems] = useState(items);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(reorderedItems);
      onReorder(reorderedItems);
    }
  };

  const handleMoveIndex = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localItems.length) return;
    const reorderedItems = arrayMove(localItems, index, targetIndex);
    setLocalItems(reorderedItems);
    onReorder(reorderedItems);
  };

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={localItems.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localItems.map((item, idx) => (
              <SortableNewsItem
                key={item.id}
                item={item}
                index={idx}
                total={localItems.length}
                onEdit={() => onEdit(item)}
                onDelete={() => setDeleteId(item.id)}
                onTogglePublish={() => onTogglePublish(item)}
                onMoveUp={() => handleMoveIndex(idx, 'up')}
                onMoveDown={() => handleMoveIndex(idx, 'down')}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="ยืนยันการลบข่าวสาร"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบข่าวสารนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
      />
    </>
  );
};
