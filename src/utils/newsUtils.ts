export interface BaseNewsRecord {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  category: string;
  published?: boolean;
  is_pinned?: boolean;
  sort_order?: number | null;
  published_at?: string | null;
  created_at?: string;
  views?: number;
  cover_image_url?: string | null;
  external_links?: { title: string; url: string }[] | null;
}

export const SCHOOL_NEWS_CATEGORIES = [
  'ข่าวประชาสัมพันธ์',
  'กิจกรรม',
  'ผลงานนักเรียน',
  'ประกาศ',
] as const;

export const SWRS_NEWS_CATEGORIES = SCHOOL_NEWS_CATEGORIES;

export const normalizeCategoryMatch = (itemCategory: string, targetCategory: string): boolean => {
  if (!targetCategory || targetCategory === 'ทั้งหมด' || targetCategory === 'all') {
    return true;
  }
  if (itemCategory === targetCategory) {
    return true;
  }
  if (
    (targetCategory === 'กิจกรรมนักเรียน' && itemCategory === 'กิจกรรม') ||
    (targetCategory === 'กิจกรรม' && itemCategory === 'กิจกรรมนักเรียน')
  ) {
    return true;
  }
  if (
    (targetCategory === 'คนเก่งรังสิต' && itemCategory === 'ผลงานนักเรียน') ||
    (targetCategory === 'ผลงานนักเรียน' && itemCategory === 'คนเก่งรังสิต')
  ) {
    return true;
  }
  return false;
};

/**
 * Sorts news items according to admin ordering:
 * 1. Lower sort_order first (when prioritizeSortOrder is true)
 * 2. Pinned items first
 * 3. Newer published_at / created_at first
 */
export const sortNewsForDisplay = <T extends BaseNewsRecord>(
  items: T[],
  prioritizeSortOrder = true
): T[] => {
  return [...items].sort((a, b) => {
    const orderA = typeof a.sort_order === 'number' ? a.sort_order : 9999;
    const orderB = typeof b.sort_order === 'number' ? b.sort_order : 9999;

    if (prioritizeSortOrder && orderA !== orderB) {
      return orderA - orderB;
    }

    const pinA = a.is_pinned ? 1 : 0;
    const pinB = b.is_pinned ? 1 : 0;
    if (pinA !== pinB) {
      return pinB - pinA;
    }

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateA = new Date(a.published_at || a.created_at || 0).getTime();
    const dateB = new Date(b.published_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });
};

export const filterNewsItems = <T extends BaseNewsRecord>(
  items: T[],
  options: { category?: string; searchTerm?: string }
): T[] => {
  const category = options.category?.trim() || 'ทั้งหมด';
  const query = options.searchTerm?.trim().toLowerCase() || '';

  return items.filter((item) => {
    const matchesCategory = normalizeCategoryMatch(item.category, category);
    if (!matchesCategory) return false;
    if (!query) return true;

    const titleMatch = item.title.toLowerCase().includes(query);
    const excerptMatch = (item.excerpt || '').toLowerCase().includes(query);
    const categoryMatch = item.category.toLowerCase().includes(query);
    return titleMatch || excerptMatch || categoryMatch;
  });
};

export const partitionNewsHomeSections = <T extends BaseNewsRecord>(items: T[]) => {
  const sorted = sortNewsForDisplay(items, true);

  const publicRelations = sorted.filter(
    (item) => item.category === 'ข่าวประชาสัมพันธ์' || item.category === 'ประกาศ'
  );
  const studentActivities = sorted.filter(
    (item) => item.category === 'กิจกรรมนักเรียน' || item.category === 'กิจกรรม'
  );
  const smartStudents = sorted.filter(
    (item) => item.category === 'ผลงานนักเรียน' || item.category === 'คนเก่งรังสิต'
  );
  const prideItems = sorted.filter(
    (item) => item.category === 'ความภาคภูมิใจ' || item.category === 'ประกาศ'
  );

  return {
    publicRelations,
    studentActivities,
    smartStudents,
    prideItems,
  };
};

export const partitionSwrsHomeSections = partitionNewsHomeSections;
