import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function AssetCard({
  title,
  statusId,
  statusText,
  statusColor,
  image,
  location,
  capacity,
  description,
  tags = [],
  onView,
  onEdit,
  onDelete,
  footerContent,
  className,
  ...props
}) {
  // Simplified image handling with error tracking
  const [imageError, setImageError] = useState(false);
  
  // Reset error when image prop changes
  useEffect(() => {
    setImageError(false);
  }, [image]);
  
  // Handle image loading error
  const handleImageError = (e) => {
    console.error("Failed to load image:", e.target.src);
    setImageError(true);
  };
  
  return (
    <Card 
      className={cn("overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow", className)}
      {...props}
    >
      {/* Image Section */}
      <div 
        className="relative h-48 overflow-hidden group cursor-pointer" 
        onClick={onView}
      >
        {(image && !imageError) ? (
          <>
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
              onError={handleImageError}
              crossOrigin="anonymous" // Add CORS support for Supabase storage
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-gray-300"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M3 15h18" />
              <path d="M3 9h18" />
              <path d="M9 9v12" />
              <path d="M15 9v12" />
            </svg>
            <p className="text-gray-500 mt-2 text-sm">No image available</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex space-x-1 z-10">
          {onEdit && (
            <Button
              size="icon" // h-8 w-8
              variant="ghost"
              className="text-gray-700 bg-gray-100 hover:text-blue-600 hover:bg-blue-100 active:bg-blue-200 rounded-md shadow-md transition-colors duration-150 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="Edit equipment"
              title="Edit equipment"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon" // h-8 w-8
              variant="ghost"
              className="text-red-500 bg-gray-100 hover:text-red-600 hover:bg-red-100 active:bg-red-200 rounded-md shadow-md transition-colors duration-150 h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete equipment"
              title="Delete equipment"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      {/* Header Section */}
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base font-semibold line-clamp-1 pb-1">
            {title}
          </CardTitle>
          {statusId && (
            <Badge className={statusColor || 'bg-gray-100 text-gray-800 hover:bg-gray-100'} variant="secondary">
              {statusText || 'Status'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {/* Content Section */}
      <CardContent className="flex-1 pb-4 pt-1 px-4">
        {/* Location */}
        {location && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="line-clamp-1">{location}</span>
          </div>
        )}
        
        {/* Capacity */}
        {capacity && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>Capacity: {capacity}</span>
          </div>
        )}
        
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-700 mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 pt-0">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-gray-100 text-black font-semibold text-xs px-3 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Footer Section */}
      {footerContent && (
        <CardFooter className="p-4 pt-0">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}
