import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  computeAiSmartLayoutPlan,
  refineNewsletterContentForTemplate,
  type AiContentRefineResult,
  type AiSmartLayoutResult,
  type ImageAnalysisMetric,
  type NewsletterTemplateType,
} from './newsletterUtils';

/**
 * Measures natural dimensions and aspect orientation for each newsletter image URL.
 */
export const measureImagesForAi = async (urls: string[]): Promise<ImageAnalysisMetric[]> => {
  const probeOne = (url: string, index: number): Promise<ImageAnalysisMetric> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => {
        resolve({
          url,
          index,
          width: 1200,
          height: 900,
          aspectRatio: 1.33,
          orientation: 'landscape',
          resolutionScore: 10,
        });
      }, 3000);

      img.onload = () => {
        clearTimeout(timer);
        const width = img.naturalWidth || img.width || 1200;
        const height = img.naturalHeight || img.height || 900;
        const aspectRatio = height > 0 ? width / height : 1;
        const orientation: ImageAnalysisMetric['orientation'] =
          aspectRatio > 1.12 ? 'landscape' : aspectRatio < 0.9 ? 'portrait' : 'square';
        const megapixels = (width * height) / 1_000_000;
        const resolutionScore = Math.min(25, Math.round(megapixels * 5) + (width >= 1200 ? 8 : 2));
        resolve({
          url,
          index,
          width,
          height,
          aspectRatio,
          orientation,
          resolutionScore,
        });
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve({
          url,
          index,
          width: 1200,
          height: 900,
          aspectRatio: 1.33,
          orientation: 'landscape',
          resolutionScore: 8,
        });
      };

      img.src = url;
    });

  return Promise.all(urls.map((u, idx) => probeOne(u, idx)));
};

/**
 * Runs AI Smart Layout using Gemini API if VITE_GEMINI_API_KEY is configured,
 * seamlessly falling back to deterministic image-metric & text-density intelligence.
 */
export const runAiSmartLayoutAssistant = async (input: {
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrls: string[];
}): Promise<AiSmartLayoutResult> => {
  const metrics = await measureImagesForAi(input.imageUrls);
  const heuristicPlan = computeAiSmartLayoutPlan({
    title: input.title,
    summary: input.summary,
    content: input.content,
    category: input.category,
    images: metrics,
  });

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey || !apiKey.trim()) {
    return heuristicPlan;
  }

  try {
    const prompt = `คุณคือบรรณาธิการออกแบบจดหมายข่าวโรงเรียน (1 หน้า A4)
ข้อมูลข่าว:
- หัวข้อ: ${input.title || '(ยังไม่มี)'}
- หมวดหมู่: ${input.category}
- ความยาวสรุป: ${(input.summary || '').length} ตัวอักษร, ความยาวเนื้อหา: ${(input.content || '').length} ตัวอักษร
- รูปภาพ (${metrics.length} รูป): ${metrics
      .map((m, i) => `[${i}] ${m.orientation} (${m.width}x${m.height})`)
      .join(', ')}

ตัวเลือกเทมเพลต:
- template_1: Hero + Grid (เหมาะกับมีภาพแนวนอนเด่น 1 ภาพ + ภาพย่อย 3-5 ภาพ)
- template_2: Magazine Zig-zag (เหมาะกับเนื้อหาละเอียด + จัดวางภาพสลับซ้ายขวา)
- template_3: Bento Collage Grid (เหมาะกับ 5-6 ภาพหลากหลายสัดส่วนและเนื้อหากระชับ)
- template_4: Classic Gallery (เหมาะกับเนื้อหายาว 2 คอลัมน์ + แกลเลอรี 2x2 หรือ 3x2)

ตอบกลับเป็น JSON เท่านั้น: {"template_type":"template_1|template_2|template_3|template_4","order":[0,1,...],"reason":"เหตุผลภาษาไทยสั้นๆ 1 ประโยค"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      }
    );

    if (!response.ok) return heuristicPlan;
    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return heuristicPlan;

    const parsed = JSON.parse(text);
    const recTemplate = parsed?.template_type;
    const orderArr: number[] = Array.isArray(parsed?.order) ? parsed.order : [];

    const validOrder = orderArr.filter(
      (idx) => Number.isInteger(idx) && idx >= 0 && idx < input.imageUrls.length
    );
    const uniqueIndices = Array.from(new Set(validOrder));
    for (let i = 0; i < input.imageUrls.length; i++) {
      if (!uniqueIndices.includes(i)) uniqueIndices.push(i);
    }

    const orderedUrls = uniqueIndices.map((idx) => input.imageUrls[idx]);
    const validTemplate = ['template_1', 'template_2', 'template_3', 'template_4'].includes(
      recTemplate
    )
      ? (recTemplate as NewsletterTemplateType)
      : heuristicPlan.recommendedTemplate;

    return {
      recommendedTemplate: validTemplate,
      orderedUrls: orderedUrls.length === input.imageUrls.length ? orderedUrls : heuristicPlan.orderedUrls,
      reason: typeof parsed?.reason === 'string' && parsed.reason.trim()
        ? parsed.reason.trim()
        : heuristicPlan.reason,
      source: 'gemini',
    };
  } catch {
    return heuristicPlan;
  }
};

/**
 * Refines summary & content copy to fit nicely inside 1 A4 page for the selected template.
 * Uses Gemini API when VITE_GEMINI_API_KEY is available, with automatic local fallback.
 */
export const runAiContentRefiner = async (input: {
  title: string;
  summary: string;
  content: string;
  templateType: NewsletterTemplateType;
}): Promise<AiContentRefineResult> => {
  const localRefined = refineNewsletterContentForTemplate(input);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  if (!apiKey || !apiKey.trim()) {
    return localRefined;
  }

  try {
    const prompt = `ช่วยเกลาภาษาไทยและจัดย่อหน้าข่าวประชาสัมพันธ์โรงเรียนให้สุภาพ เป็นทางการ กระชับ และพอดีกับจดหมายข่าว 1 หน้า A4 (${input.templateType}):
หัวข้อ: ${input.title}
สรุปเดิม: ${input.summary}
เนื้อหาเดิม: ${input.content}

ตอบกลับเป็น JSON เท่านั้น: {"summary":"สรุป 1-2 ประโยค ไม่เกิน 180 ตัวอักษร","content":"เนื้อหาจัดย่อหน้าสวยงาม ไม่เกิน 550 ตัวอักษร","note":"คำอธิบายสั้นๆ ว่าปรับอะไรบ้าง"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
        }),
      }
    );

    if (!response.ok) return localRefined;
    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return localRefined;

    const parsed = JSON.parse(text);
    if (typeof parsed?.summary === 'string' && typeof parsed?.content === 'string') {
      return {
        summary: parsed.summary.trim() || localRefined.summary,
        content: parsed.content.trim() || localRefined.content,
        note: typeof parsed?.note === 'string' && parsed.note.trim()
          ? parsed.note.trim()
          : 'AI ช่วยเกลาภาษาและปรับความยาวให้พอดี 1 หน้า A4 แล้ว',
        source: 'gemini',
      };
    }
    return localRefined;
  } catch {
    return localRefined;
  }
};

/**
 * Converts a remote image URL to an inline Data URL using CORS fetch so html2canvas
 * renders every photo crisply without tainted-canvas errors.
 */
const inlineImageSrcForCanvas = async (src: string): Promise<string> => {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }
  try {
    const response = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (!response.ok) return src;
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || src);
      reader.onerror = () => resolve(src);
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
};

/**
 * Captures the rendered 794x1123px A4 sheet element at high DPI and exports
 * strictly 1 A4 Portrait PDF page (210mm x 297mm) with zero overflow onto page 2.
 */
export const exportNewsletterA4ToPdf = async (
  sourceElement: HTMLElement,
  fileName: string = 'newsletter-a4.pdf'
): Promise<void> => {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-99999px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px';
  wrapper.style.height = '1123px';
  wrapper.style.overflow = 'hidden';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.zIndex = '-1';

  const clone = sourceElement.cloneNode(true) as HTMLElement;
  clone.style.width = '794px';
  clone.style.height = '1123px';
  clone.style.maxWidth = 'none';
  clone.style.maxHeight = 'none';
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const imgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      imgs.map(async (imgEl) => {
        const rawSrc = imgEl.getAttribute('src') || '';
        if (rawSrc) {
          const inlined = await inlineImageSrcForCanvas(rawSrc);
          if (inlined && inlined !== rawSrc) {
            imgEl.setAttribute('src', inlined);
          }
        }
        if (!imgEl.complete) {
          await new Promise<void>((resolve) => {
            imgEl.onload = () => resolve();
            imgEl.onerror = () => resolve();
          });
        }
      })
    );

    const canvas = await html2canvas(clone, {
      scale: 2.4,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Fit strictly inside 1 A4 page (210mm x 297mm)
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(safeName);
  } finally {
    document.body.removeChild(wrapper);
  }
};
