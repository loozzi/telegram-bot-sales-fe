import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Boxes, Upload, Trash2, X, Check, FileUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { inventoriesApi, resourcesApi, shopsApi } from '../../api';
import type { Inventory, Shop, Resource } from '../../types';
import './Inventories.css';

export function InventoriesPage() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedShopId, setSelectedShopId] = useState<string>('');
    const [selectedResourceId, setSelectedResourceId] = useState<string>('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [deletingInventory, setDeletingInventory] = useState<Inventory | null>(null);

    const { data: shopsData } = useQuery({
        queryKey: ['shops'],
        queryFn: shopsApi.list,
    });

    const { data: resourcesData } = useQuery({
        queryKey: ['resources', selectedShopId],
        queryFn: () => resourcesApi.list(selectedShopId),
        enabled: !!selectedShopId,
    });

    const { data: inventoriesData, isLoading } = useQuery({
        queryKey: ['inventories', selectedResourceId],
        queryFn: () => inventoriesApi.list(selectedResourceId),
        enabled: !!selectedResourceId,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => inventoriesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            toast.success('Inventory item deleted!');
            setDeletingInventory(null);
        },
        onError: () => toast.error('Failed to delete'),
    });

    const uploadMutation = useMutation({
        mutationFn: ({ resourceId, file }: { resourceId: string; file: File }) =>
            inventoriesApi.upload(resourceId, file),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            toast.success(`Uploaded ${response.data?.total_created || 0} items!`);
            setIsUploadModalOpen(false);
            setUploadFile(null);
        },
        onError: () => toast.error('Failed to upload'),
    });

    const toggleSoldMutation = useMutation({
        mutationFn: ({ id, is_sold }: { id: string; is_sold: boolean }) =>
            inventoriesApi.update(id, { is_sold }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventories'] });
            toast.success('Status updated!');
        },
        onError: () => toast.error('Failed to update'),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setUploadFile(file);
    };

    const handleUpload = () => {
        if (uploadFile && selectedResourceId) {
            uploadMutation.mutate({ resourceId: selectedResourceId, file: uploadFile });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setUploadFile(file);
    };

    const shops: Shop[] = shopsData?.items || [];
    const resources: Resource[] = resourcesData?.items || [];
    const inventories: Inventory[] = inventoriesData?.items || [];
    const soldCount = inventories.filter(i => i.is_sold).length;
    const availableCount = inventories.length - soldCount;

    return (
        <div className="inventories-page animate-fadeIn">
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">Inventories</h1>
                    <p className="page-subtitle">Manage your inventory items</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsUploadModalOpen(true)}
                    disabled={!selectedResourceId}
                >
                    <Upload size={18} />
                    Bulk Upload
                </button>
            </div>

            <div className="filter-bar card">
                <div className="filters-row">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Shop</label>
                        <select
                            className="form-input"
                            value={selectedShopId}
                            onChange={(e) => {
                                setSelectedShopId(e.target.value);
                                setSelectedResourceId('');
                            }}
                        >
                            <option value="">-- Select shop --</option>
                            {shops.map((shop) => (
                                <option key={shop.id} value={shop.id}>{shop.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Resource</label>
                        <select
                            className="form-input"
                            value={selectedResourceId}
                            onChange={(e) => setSelectedResourceId(e.target.value)}
                            disabled={!selectedShopId}
                        >
                            <option value="">-- Select resource --</option>
                            {resources.map((resource) => (
                                <option key={resource.id} value={resource.id}>{resource.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedResourceId && inventories.length > 0 && (
                <div className="inventory-stats">
                    <div className="stat-badge available">
                        <Boxes size={16} />
                        <span>Available: {availableCount}</span>
                    </div>
                    <div className="stat-badge sold">
                        <Check size={16} />
                        <span>Sold: {soldCount}</span>
                    </div>
                </div>
            )}

            {!selectedResourceId ? (
                <div className="empty-state card">
                    <Package size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">Select a resource</h3>
                    <p className="empty-state-text">
                        Choose a shop and resource to view inventory items.
                    </p>
                </div>
            ) : isLoading ? (
                <div className="page-loader">
                    <div className="spinner spinner-lg" />
                </div>
            ) : inventories.length === 0 ? (
                <div className="empty-state card">
                    <Boxes size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">No inventory items</h3>
                    <p className="empty-state-text">
                        Upload a file to add inventory items in bulk.
                    </p>
                    <button
                        className="btn btn-primary mt-4"
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        <Upload size={18} />
                        Upload File
                    </button>
                </div>
            ) : (
                <div className="table-container card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Content</th>
                                <th style={{ width: 120 }}>Status</th>
                                <th style={{ width: 80 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventories.map((item) => (
                                <tr key={item.id} className={item.is_sold ? 'sold' : ''}>
                                    <td>
                                        <code className="inventory-content">{item.content}</code>
                                    </td>
                                    <td>
                                        <button
                                            className={`status-toggle ${item.is_sold ? 'sold' : 'available'}`}
                                            onClick={() => toggleSoldMutation.mutate({
                                                id: item.id,
                                                is_sold: !item.is_sold,
                                            })}
                                        >
                                            {item.is_sold ? 'Sold' : 'Available'}
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setDeletingInventory(item)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Bulk Upload</h2>
                            <button className="modal-close" onClick={() => setIsUploadModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div
                                className="upload-zone"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <FileUp size={48} className="upload-icon" />
                                <p className="upload-text">
                                    {uploadFile ? uploadFile.name : 'Drop file here or click to browse'}
                                </p>
                                <p className="upload-hint">
                                    Text file with one item per line
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsUploadModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={!uploadFile || uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? (
                                    <span className="spinner" style={{ width: 18, height: 18 }} />
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Upload
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletingInventory && (
                <div className="modal-overlay" onClick={() => setDeletingInventory(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Item</h2>
                            <button className="modal-close" onClick={() => setDeletingInventory(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Delete this inventory item?</p>
                            <code className="delete-preview">{deletingInventory.content}</code>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setDeletingInventory(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => deleteMutation.mutate(deletingInventory.id)}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <span className="spinner" style={{ width: 18, height: 18 }} />
                                ) : (
                                    <>
                                        <Trash2 size={18} />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
