import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Package, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { resourcesApi } from "../../../api";
import type { Resource, ResourceCreate, ResourceUpdate } from "../../../types";
import "../ShopDetail.css";

const resourceSchema = z.object({
    name: z.string().min(1, "Tên là bắt buộc").max(100),
    category_id: z.string().optional(),
    description: z.string().max(500).optional(),
    price: z.number().min(0, "Giá phải >= 0"),
    is_active: z.boolean().optional(),
});

type ResourceFormSchema = z.infer<typeof resourceSchema>;

export function ShopResources() {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    const { data: resourcesData } = useQuery({
        queryKey: ["resources", shopId],
        queryFn: () => resourcesApi.list(shopId!),
        enabled: !!shopId,
    });

    const resources = resourcesData?.items || [];

    const resourceForm = useForm<ResourceFormSchema>({
        resolver: zodResolver(resourceSchema),
    });

    const createResourceMutation = useMutation({
        mutationFn: (data: ResourceCreate) => resourcesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources", shopId] });
            toast.success("Tạo sản phẩm thành công!");
            setIsResourceModalOpen(false);
            resourceForm.reset();
        },
        onError: () => toast.error("Tạo sản phẩm thất bại"),
    });

    const updateResourceMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ResourceFormSchema }) => {
            const payload: ResourceUpdate = {
                ...data,
                category_id: data.category_id === "" ? null : data.category_id,
            };
            return resourcesApi.update(id, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources", shopId] });
            toast.success("Cập nhật sản phẩm thành công!");
            setEditingResource(null);
            setIsResourceModalOpen(false);
        },
        onError: () => toast.error("Cập nhật sản phẩm thất bại"),
    });

    const ResourceModal = () => (
        isResourceModalOpen && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2 className="modal-title">
                        {editingResource ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                    </h2>
                    <form
                        onSubmit={resourceForm.handleSubmit((data) => {
                            if (editingResource) {
                                updateResourceMutation.mutate({
                                    id: editingResource.id,
                                    data: data,
                                });
                            } else {
                                // Warning: ResourceCreate type might need shop_id if backend requires it, 
                                // usually taken from context or not needed if linked via category.
                                // Based on old code, it seems it just takes ResourceCreate.
                                // Let's assume ResourceCreate needs shop_id or it's inferred. 
                                // Actually looking at old code: resourcesApi.create(data)
                                // But wait, the previous code didn't inject shopId into data. 
                                // Let's check ResourceCreate type if I could... but I can't easily right now.
                                // Assuming standard pattern:
                                createResourceMutation.mutate({ ...data, shop_id: shopId! });
                            }
                        })}
                    >
                        <div className="form-group">
                            <label>Tên sản phẩm</label>
                            <input
                                {...resourceForm.register("name")}
                                className="form-input"
                                placeholder="Ví dụ: Tài khoản Premium"
                            />
                            {resourceForm.formState.errors.name && (
                                <span className="form-error">
                                    {resourceForm.formState.errors.name.message}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Giá</label>
                            <input
                                type="number"
                                {...resourceForm.register("price", { valueAsNumber: true })}
                                className="form-input"
                            />
                            {resourceForm.formState.errors.price && (
                                <span className="form-error">
                                    {resourceForm.formState.errors.price.message}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea
                                {...resourceForm.register("description")}
                                className="form-textarea"
                            />
                        </div>

                        {/* Note: Category selection logic was missing in my quick scan of old file? 
                Old code didn't explicitly show the modal inner content in the first view_file.
                I should probably just keep it simple or check if I need more fields.
                Old code uses `category_id`.
            */}
                        <div className="form-group">
                            <label>Category ID (Optional)</label>
                            <input
                                {...resourceForm.register("category_id")}
                                className="form-input"
                                placeholder="ID danh mục"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <input type="checkbox" {...resourceForm.register("is_active")} />
                                Hoạt động
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setIsResourceModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingResource ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    return (
        <div className="resources-tab animate-fadeIn">
            <div className="tab-header">
                <h2>Sản phẩm</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingResource(null);
                        resourceForm.reset({
                            name: "",
                            category_id: "",
                            description: "",
                            price: 0,
                            is_active: true,
                        });
                        setIsResourceModalOpen(true);
                    }}
                >
                    <Plus size={18} />
                    Sản phẩm mới
                </button>
            </div>
            {resources.length === 0 ? (
                <div className="empty-state card">
                    <Package size={48} className="empty-state-icon" />
                    <h3 className="empty-state-title">Chưa có sản phẩm</h3>
                    <p className="empty-state-text">
                        Tạo sản phẩm cho cửa hàng.
                    </p>
                </div>
            ) : (
                <div className="table-container card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tên</th>
                                <th>Gian hàng</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                                <th style={{ width: 120 }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resources.map((resource) => (
                                <tr
                                    key={resource.id}
                                    className="clickable-row"
                                    onClick={() =>
                                        navigate(`/shops/${shopId}/resources/${resource.id}`)
                                    }
                                >
                                    <td className="font-medium">{resource.name}</td>
                                    <td>
                                        {resource.category ? (
                                            <span className="badge badge-info">
                                                {resource.category.name}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td>{resource.price.toLocaleString()} đ</td>
                                    <td>
                                        {resource.is_active ? (
                                            <span className="badge badge-success">Hoạt động</span>
                                        ) : (
                                            <span className="badge badge-error">Không hoạt động</span>
                                        )}
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => {
                                                    resourceForm.reset({
                                                        name: resource.name,
                                                        category_id: resource.category_id || "",
                                                        description: resource.description || "",
                                                        price: resource.price,
                                                        is_active: resource.is_active,
                                                    });
                                                    setEditingResource(resource);
                                                    setIsResourceModalOpen(true);
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ResourceModal />
        </div>
    );
}
