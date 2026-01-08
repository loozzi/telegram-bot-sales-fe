import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Folder, Edit2, Trash2, X, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { categoriesApi, shopsApi } from "../../api";
import type { Category, CategoryCreate, Shop } from "../../types";


const categorySchema = z.object({
  shop_id: z.string().min(1, "Cửa hàng là bắt buộc"),
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  description: z.string().max(500).optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  const { data: shopsData } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsApi.list,
  });

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", selectedShopId],
    queryFn: () => categoriesApi.list(selectedShopId),
    enabled: !!selectedShopId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryCreate) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Tạo danh mục thành công!");
      closeModal();
    },
    onError: () => toast.error("Tạo danh mục thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryCreate> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Cập nhật danh mục thành công!");
      closeModal();
    },
    onError: () => toast.error("Cập nhật danh mục thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Xóa danh mục thành công!");
      setDeletingCategory(null);
    },
    onError: () => toast.error("Xóa danh mục thất bại"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      shop_id: selectedShopId,
      name: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({
      shop_id: category.shop_id,
      name: category.name,
      description: category.description || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const shops: Shop[] = shopsData?.items || [];

  return (
    <div className="categories-page animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Danh Mục</h1>
          <p className="page-subtitle">
            Quản lý danh mục sản phẩm của cửa hàng
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={!selectedShopId}
        >
          <Plus size={18} />
          Danh Mục Mới
        </button>
      </div>

      <div className="filter-bar card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Chọn Cửa Hàng</label>
          <select
            className="form-input"
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
          >
            <option value="">-- Chọn cửa hàng --</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedShopId ? (
        <div className="empty-state card">
          <Folder size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Chọn một cửa hàng</h3>
          <p className="empty-state-text">
            Vui lòng chọn cửa hàng ở trên để xem và quản lý danh mục.
          </p>
        </div>
      ) : isLoading ? (
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      ) : categoriesData?.items?.length === 0 ? (
        <div className="empty-state card">
          <Folder size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Chưa có danh mục</h3>
          <p className="empty-state-text">
            Tạo danh mục đầu tiên để phân loại sản phẩm.
          </p>
          <button className="btn btn-primary mt-4" onClick={openCreateModal}>
            <Plus size={18} />
            Tạo Danh Mục
          </button>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Tên Danh Mục</th>
                <th>Mô Tả</th>
                <th style={{ width: 120 }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {categoriesData?.items?.map((category) => (
                <tr key={category.id}>
                  <td className="font-medium">{category.name}</td>
                  <td className="text-secondary truncate" style={{ maxWidth: 400 }}>
                    {category.description || "-"}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditModal(category)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeletingCategory(category)}
                      >
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCategory ? "Sửa Danh Mục" : "Tạo Danh Mục"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cửa Hàng</label>
                  <select
                    className={`form-input ${errors.shop_id ? "error" : ""}`}
                    {...register("shop_id")}
                    disabled={!!editingCategory}
                  >
                    <option value="">Chọn cửa hàng</option>
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                  {errors.shop_id && (
                    <span className="form-error">{errors.shop_id.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Tên Danh Mục</label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="Ví dụ: Tài khoản Netflix, Game Keys, ..."
                    {...register("name")}
                  />
                  {errors.name && (
                    <span className="form-error">{errors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Mô Tả</label>
                  <textarea
                    className="form-input"
                    placeholder="Mô tả về danh mục này (tùy chọn)"
                    rows={3}
                    {...register("description")}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span
                      className="spinner"
                      style={{ width: 18, height: 18 }}
                    />
                  ) : (
                    <>
                      <Check size={18} />
                      {editingCategory ? "Cập Nhật" : "Tạo"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCategory && (
        <div
          className="modal-overlay"
          onClick={() => setDeletingCategory(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Xóa Danh Mục</h2>
              <button
                className="modal-close"
                onClick={() => setDeletingCategory(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa danh mục{" "}
                <strong>{deletingCategory.name}</strong>?
              </p>
              <p className="text-warning mt-2">
                Lưu ý: Các sản phẩm trong danh mục này sẽ không bị xóa, nhưng sẽ không còn thuộc danh mục nào.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingCategory(null)}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={() => deleteMutation.mutate(deletingCategory.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Xóa
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
