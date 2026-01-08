import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Breadcrumb.css";

export interface BreadcrumbItem {
  label: string;
  path?: string; // undefined = current page (not clickable)
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {item.path ? (
              <Link to={item.path} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <ChevronRight size={16} className="breadcrumb-separator" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
