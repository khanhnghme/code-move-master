import { Link } from 'react-router-dom';
import { FolderKanban, Users, Calendar, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Group } from '@/types/database';

interface DashboardProjectCardProps {
  group: Group;
}

export default function DashboardProjectCard({
  group,
}: DashboardProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Link
      to={`/p/${group.slug}`}
      className="group relative block rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
    >
      {/* Image Section - fixed aspect ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt={group.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
            <FolderKanban className="w-10 h-10 text-primary/40" />
          </div>
        )}
        
        {/* Public badge - top right */}
        {group.is_public && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 text-[10px] bg-background/90 backdrop-blur-sm px-1.5 py-0.5"
          >
            <Globe className="w-2.5 h-2.5 mr-0.5" />
            Public
          </Badge>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {group.name}
        </h3>
        
        {group.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {group.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
          {group.class_code && (
            <span className="flex items-center gap-0.5 bg-muted/70 px-1.5 py-0.5 rounded">
              <Users className="w-2.5 h-2.5" />
              {group.class_code}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(group.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}