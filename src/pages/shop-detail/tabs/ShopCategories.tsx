import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Folder, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { categoriesApi } from "../../../api";
import type { Category, CategoryCreate, CategoryUpdate } from "../../../types";
import "../ShopDetail.css";

const categorySchema = z.object({
    name: z.string().min(1, "Tên là bắt buộc").max(100),
    description: z.string().max(500).optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export function ShopCategories() {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data: categoriesData } = useQuery({
        queryKey: ["categories", shopId],
        queryFn: () => categoriesApi.list(shopId!),
        enabled: !!shopId,
    });

    const categories = categoriesData?.items || [];

    const categoryForm = useForm<CategoryForm>({
        resolver: zodResolver(categorySchema),
    });

    const createCategoryMutation = useMutation({
        mutationFn: (data: CategoryCreate) => categoriesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
            toast.success("Tạo gian hàng thành công!");
            setIsCategoryModalOpen(false);
            categoryForm.reset();
        },
        onError: () => toast.error("Tạo gian hàng thất bại"),
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
            categoriesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
            toast.success("Cập nhật gian hàng thành công!");
            setEditingCategory(null);
            setIsCategoryModalOpen(false);
        },
        onError: () => toast.error("Cập nhật gian hàng thất bại"),
    });

    // Modal Component (inline for simplicity, or could be extracted)
    const CategoryModal = () => (
        isCategoryModalOpen && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2 className="modal-title">
                        {editingCategory ? "Chỉnh sửa gian hàng" : "Thêm gian hàng mới"}
                    </h2>
                    <form
                        onSubmit={categoryForm.handleSubmit((data) => {
                            if (editingCategory) {
                                updateCategoryMutation.mutate({
                                    id: editingCategory.id,
                                    data: { ...data },
                                });
                            } else {
                                createCategoryMutation.mutate({ ...data, shop_id: shopId! });
                            }
                        })}
                    >
                        <div className="form-group">
                            <label>Tên gian hàng</label>
                            <input
                                {...categoryForm.register("name")}
                                className="form-input"
                                placeholder="Ví dụ: Netflix, Spotify..."
                            />
                            {categoryForm.formState.errors.name && (
                                <span className="form-error">
                                    {categoryForm.formState.errors.name.message}
                                </span>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Mô tả</label>
                            <textarea
                                {...categoryForm.register("description")}
                                className="form-textarea"
                                placeholder="Mô tả ngắn về gian hàng..."
                            />
                            {categoryForm.formState.errors.description && (
                                <span className="form-error">
                                    {categoryForm.formState.errors.description.message}
                                </span>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setIsCategoryModalOpen(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingCategory ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    );

    return (
        <div className="categories-tab animate-fadeIn">
            <div className="tab-header">
                <h2>Gian hàng</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingCategory(null);
                        categoryForm.reset({ name: "", description: "" });
                        setIsCategoryModalOpen(true);
                    }}
                >
                    <Plus size={18} />
                    Gian hàng mới
                </button>
            </div>
            {categories.length === 0 ? (
                <div className="empty-state card">
                    <Folder size={48} className="empty-state-icon" />
                    <h3 className="empty-state-title">Chưa có gian hàng</h3>
                    <p className="empty-state-text">
                        Tạo gian hàng để phân loại sản phẩm của bạn.
                    </p>
                </div>
            ) : (
                <div className="table-container card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tên gian hàng</th>
                                <th>Mô tả</th>
                                <th style={{ width: 120 }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((category) => (
                                <tr
                                    key={category.id}
                                    className="clickable-row"
                                    onClick={() =>
                                        navigate(`/shops/${shopId}/categories/${category.id}`)
                                    }
                                >
                                    <td className="font-medium">{category.name}</td>
                                    <td className="text-secondary truncate">
                                        {category.description || "-"}
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="flex gap-2">
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => {
                                                    categoryForm.reset({
                                                        name: category.name,
                                                        description: category.description || "",
                                                    });
                                                    setEditingCategory(category);
                                                    setIsCategoryModalOpen(true);
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <CategoryModal />
        </div>
    );
}
