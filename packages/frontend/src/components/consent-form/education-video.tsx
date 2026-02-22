'use client';

import { useTranslations } from 'next-intl';

interface EducationVideoProps {
  url: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`;
  }

  return null;
}

export function EducationVideo({ url }: EducationVideoProps) {
  const t = useTranslations('consent');
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">{t('educationVideo')}</h3>
      <p className="text-sm text-muted-foreground">{t('educationVideoHint')}</p>
      <div className="aspect-video rounded-lg overflow-hidden border">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title={t('educationVideo')}
        />
      </div>
    </div>
  );
}
