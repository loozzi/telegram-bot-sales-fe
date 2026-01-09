import { useQuery } from "@tanstack/react-query";
import { Folder, Package } from "lucide-react";
import { useParams } from "react-router-dom";
import { categoriesApi, resourcesApi } from "../../../api";
import "../ShopDetail.css";

export function ShopOverview() {
    const { shopId } = useParams<{ shopId: string }>();

    const { data: categoriesData } = useQuery({
        queryKey: ["categories", shopId],
        queryFn: () => categoriesApi.list(shopId!),
        enabled: !!shopId,
    });

    const { data: resourcesData } = useQuery({
        queryKey: ["resources", shopId],
        queryFn: () => resourcesApi.list(shopId!),
        enabled: !!shopId,
    });

    const categories = categoriesData?.items || [];
    const resources = resourcesData?.items || [];

    return (
        <div className="overview-tab animate-fadeIn">
            <div className="stats-grid">
                <div className="stat-card card">
                    <Folder size={24} className="stat-icon" />
                    <div className="stat-info">
                        <p className="stat-label">Gian hàng</p>
                        <p className="stat-value">{categories.length}</p>
                    </div>
                </div>
                <div className="stat-card card">
                    <Package size={24} className="stat-icon" />
                    <div className="stat-info">
                        <p className="stat-label">Sản phẩm</p>
                        <p className="stat-value">{resources.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
