import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackButtonProps {
    to?: string;
    label?: string;
    className?: string;
}

export function BackButton({ to, label = "Quay lại", className = "" }: BackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button
            onClick={handleClick}
            className={`btn btn-ghost flex items-center gap-2 text-secondary hover:text-primary transition-colors ${className}`}
            style={{ marginBottom: '1rem' }}
        >
            <ArrowLeft size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );
}
