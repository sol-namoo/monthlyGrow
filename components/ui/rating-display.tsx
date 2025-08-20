import { Star, Bookmark } from "lucide-react";
import { Badge } from "./badge";

interface RatingDisplayProps {
  rating: number;
  bookmarked?: boolean;
  showBookmark?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDisplay({
  rating,
  bookmarked = false,
  showBookmark = true,
  size = "md",
  className = "",
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 별점 표시 */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${iconSizes[size]} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className={`ml-1 ${sizeClasses[size]} text-muted-foreground`}>
          {rating}/5
        </span>
      </div>

      {/* 북마크 표시 */}
      {showBookmark && bookmarked && (
        <Bookmark
          className={`${iconSizes[size]} text-yellow-500 fill-yellow-500`}
        />
      )}
    </div>
  );
}

// 별점만 표시하는 컴포넌트 (숫자 없이)
export function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconSizes[size]} ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// 북마크만 표시하는 컴포넌트
export function BookmarkIcon({
  bookmarked,
  size = "md",
}: {
  bookmarked: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!bookmarked) return null;

  return (
    <Bookmark
      className={`${iconSizes[size]} text-yellow-500 fill-yellow-500`}
    />
  );
}
