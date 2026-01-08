import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, X, Check } from "lucide-react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { categoriesApi, resourcesApi, shopsApi } from "../../api";
import { Breadcrumb } from "../../components/Breadcrumb";
import type { Resource, ResourceCreate } from "../../types";
import "./CategoryDetail.css";

const resourceSchema = z.object({
  shop_id: z.string(),
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Giá phải là số dương"),
  is_active: z.boolean().optional(),
});

type ResourceForm = z.infer<typeof resourceSchema>;

export function CategoryDetailPage() {
  const { shopId, categoryId } = useParams<{ shopId: string; categoryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { data: shopData } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.get(shopId!),
    enabled: !!shopId,
  });

  const { data: categoryData, isLoading: categoryLoading } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => categoriesApi.get(categoryId!),
    enabled: !!categoryId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", shopId],
    queryFn: () => categoriesApi.list(shopId!),
    enabled: !!shopId,
  });

  const categories = categoriesData?.items || [];

  const createMutation = useMutation({
    mutationFn: (data: ResourceCreate) => resourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      toast.success("Tạo tài nguyên thành công!");
      closeModal();
    },
    onError: () => toast.error("Tạo thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResourceCreate> }) => {
      const payload: Partial<ResourceCreate> = {
        ...data,
        category_id: data.category_id === "" ? null : data.category_id,
      };
      return resourcesApi.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      toast.success("Cập nhật thành công!");
      closeModal();
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      toast.success("Xóa tài nguyên thành công!");
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      resourcesApi.updateStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["category", categoryId] });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
  });

  const openCreateModal = () => {
    setEditingResource(null);
    reset({
      shop_id: shopId!,
      category_id: categoryId,
      name: "",
      description: "",
      price: 0,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    reset({
      shop_id: resource.shop_id,
      category_id: resource.category_id || categoryId || "",
      name: resource.name,
      description: resource.description || "",
      price: resource.price,
      is_active: resource.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
    reset();
  };

  const onSubmit = (data: ResourceForm) => {
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const shop = shopData?.data;
  const category = categoryData?.data;
  const resources = category?.resources || [];

  if (categoryLoading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!category || !shop) {
    return (
      <div className="empty-state card">
        <h3>Không tìm thấy danh mục</h3>
        <button
          className="btn btn-primary mt-4"
          onClick={() => navigate(`/shops/${shopId}`)}
        >
          Quay lại
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Cửa hàng", path: "/shops" },
    { label: shop.name, path: `/shops/${shopId}` },
    { label: category.name },
  ];

  return (
    <div className="category-detail-page animate-fadeIn">
      <Breadcrumb items={breadcrumbItems} />

      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">{category.name}</h1>
          {category.description && (
            <p className="page-subtitle">{category.description}</p>
          )}
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Tài nguyên mới
        </button>
      </div>

      {resources.length === 0 ? (
        <div className="empty-state card">
          <Package size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Chưa có tài nguyên</h3>
          <p className="empty-state-text">
            Tạo tài nguyên đầu tiên trong danh mục này.
          </p>
          <button className="btn btn-primary mt-4" onClick={openCreateModal}>
            <Plus size={18} />
            Tạo tài nguyên
          </button>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mô tả</th>
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
                  <td className="text-secondary truncate" style={{ maxWidth: 300 }}>
                    {resource.description || "-"}
                  </td>
                  <td>{resource.price.toLocaleString()} đ</td>
                  <td>
                    <button
                      className={`badge border-none cursor-pointer ${
                        resource.is_active ? "badge-success" : "badge-error"
                      } ${toggleStatusMutation.isPending ? "opacity-50" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatusMutation.mutate({
                          id: resource.id,
                          is_active: !resource.is_active,
                        });
                      }}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {resource.is_active ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditModal(resource)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          if (window.confirm("Bạn có chắc muốn xóa tài nguyên này?")) {
                            deleteMutation.mutate(resource.id);
                          }
                        }}
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
                {editingResource ? "Sửa tài nguyên" : "Tạo tài nguyên"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên</label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? "error" : ""}`}
                    {...register("name")}
                  />
                  {errors.name && (
                    <span className="form-error">{errors.name.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-input" {...register("category_id")}>
                    <option value="">Không có danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    {...register("description")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Giá</label>
                  <input
                    type="number"
                    className={`form-input ${errors.price ? "error" : ""}`}
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <span className="form-error">{errors.price.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <div className="flex items-center gap-3">
                    <label className="toggle-switch">
                      <input type="checkbox" {...register("is_active")} />
                      <span className="slider"></span>
                    </label>
                    <span>Hoạt động</span>
                  </div>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                    <>
                      <Check size={18} />
                      {editingResource ? "Cập nhật" : "Tạo"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
