import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  brand?: string;
  className?: string;
}

export function CategoryBadge({ category, brand, className }: CategoryBadgeProps) {
  // Determine background color based on category
  const getBgColor = () => {
    switch (category.toLowerCase()) {
      case "family":
        return "bg-accent";
      case "household":
        return "bg-pink-500";
      case "cash":
        return "bg-primary";
      case "beauty":
        return "bg-rose-500";
      default:
        return "bg-primary";
    }
  };
  
  // Determine icon based on category
  const getIcon = () => {
    switch (category.toLowerCase()) {
      case "family":
        return "fas fa-users";
      case "household":
        return "fas fa-blender";
      case "cash":
        return "fas fa-pound-sign";
      case "beauty":
        return "fas fa-spa";
      default:
        return "fas fa-trophy";
    }
  };
  
  const displayText = brand || category.charAt(0).toUpperCase() + category.slice(1);
  
  return (
    <div className={cn(
      "text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase flex items-center shadow-md",
      getBgColor(),
      className
    )}>
      <i className={`${getIcon()} mr-1.5`}></i>
      {displayText}
    </div>
  );
}
