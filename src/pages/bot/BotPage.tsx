import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot as BotIcon, Play, Square, RefreshCw, Store, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { botApi, shopsApi } from '../../api';
import './Bot.css';

export function BotPage() {
    const queryClient = useQueryClient();

    const { data: shopsData, isLoading } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    const startMutation = useMutation({
        mutationFn: (shopId: string) => botApi.startMyBot(shopId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Bot started!');
        },
        onError: () => toast.error('Failed to start bot'),
    });

    const stopMutation = useMutation({
        mutationFn: (shopId: string) => botApi.stopMyBot(shopId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Bot stopped!');
        },
        onError: () => toast.error('Failed to stop bot'),
    });

    const reloadMutation = useMutation({
        mutationFn: () => botApi.reloadAll(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('All bots reloaded!');
        },
        onError: () => toast.error('Failed to reload bots'),
    });

    const shops = shopsData?.items || [];
    const activeCount = shops.filter(s => s.is_active).length;

    return (
        <div className="bot-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Bot Management</h1>
                    <p className="page-subtitle">Control your Telegram bots</p>
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={() => reloadMutation.mutate()}
                    disabled={reloadMutation.isPending}
                >
                    {reloadMutation.isPending ? (
                        <span className="spinner" style={{ width: 18, height: 18 }} />
                    ) : (
                        <>
                            <RefreshCw size={18} />
                            Reload All
                        </>
                    )}
                </button>
            </div>

            <div className="bot-stats">
                <div className="stat-card-small">
                    <BotIcon size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{shops.length}</span>
                        <span className="stat-label">Total Bots</span>
                    </div>
                </div>
                <div className="stat-card-small active">
                    <Play size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{activeCount}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="stat-card-small inactive">
                    <Square size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{shops.length - activeCount}</span>
                        <span className="stat-label">Inactive</span>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : shops.length === 0 ? (
                <div className="empty-state card">
                    <BotIcon size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">No bots configured</h3>
                    <p className="empty-state-text">
                        Create a shop first to start managing bots.
                    </p>
                </div>
            ) : (
                <div className="bot-grid">
                    {shops.map((shop) => (
                        <div key={shop.id} className={`bot-card card ${shop.is_active ? 'active' : ''}`}>
                            <div className="bot-card-header">
                                <div className="bot-icon-wrapper">
                                    <Store size={24} />
                                    <div className={`status-dot ${shop.is_active ? 'online' : 'offline'}`} />
                                </div>
                                <div className="bot-info">
                                    <h3 className="bot-name">{shop.name}</h3>
                                    <span className="bot-status">
                                        {shop.is_active ? (
                                            <><Check size={14} /> Running</>
                                        ) : (
                                            <><X size={14} /> Stopped</>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="bot-details">
                                <div className="detail-row">
                                    <span className="detail-label">Status</span>
                                    <span className={`badge ${shop.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                        {shop.status}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Token</span>
                                    <code className="detail-value">{shop.bot_token.slice(0, 15)}...</code>
                                </div>
                            </div>

                            <div className="bot-actions">
                                {shop.is_active ? (
                                    <button
                                        className="btn btn-danger w-full"
                                        onClick={() => stopMutation.mutate(shop.id)}
                                        disabled={stopMutation.isPending}
                                    >
                                        {stopMutation.isPending ? (
                                            <span className="spinner" style={{ width: 18, height: 18 }} />
                                        ) : (
                                            <>
                                                <Square size={18} />
                                                Stop Bot
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={() => startMutation.mutate(shop.id)}
                                        disabled={startMutation.isPending}
                                    >
                                        {startMutation.isPending ? (
                                            <span className="spinner" style={{ width: 18, height: 18 }} />
                                        ) : (
                                            <>
                                                <Play size={18} />
                                                Start Bot
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
