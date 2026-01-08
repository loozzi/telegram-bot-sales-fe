import { Outlet, useParams } from 'react-router-dom';
import { ShopSidebar } from './ShopSidebar';
import './Layout.css';
import { useQuery } from '@tanstack/react-query';
import { shopsApi } from '../../api';

export function ShopLayout() {
    const { shopId } = useParams<{ shopId: string }>();

    // Optional: Fetch shop details here to ensure context or handle 404
    const { isLoading, isError } = useQuery({
        queryKey: ["shop", shopId],
        queryFn: () => shopsApi.get(shopId!),
        enabled: !!shopId,
        retry: false
    });

    if (isLoading) {
        return <div className="page-loader"><div className="spinner" /></div>;
    }

    if (isError) {
        return <div className="error-state">Shop not found</div>;
    }

    return (
        <div className="app-layout">
            <ShopSidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
