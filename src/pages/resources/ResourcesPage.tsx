import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Package, Edit2, Trash2, X, Check, Power, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { resourcesApi, shopsApi, categoriesApi } from "../../api";
import type { Resource, ResourceCreate, Shop } from "../../types";
import "./Resources.css";

const resourceSchema = z.object({
  shop_id: z.string().min(1, "Cửa hàng là bắt buộc"),
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Giá phải là số dương"),
  is_active: z.boolean(),
});

type ResourceForm = z.infer<typeof resourceSchema>;

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(
    null
  );

  const { data: shopsData } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsApi.list,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", selectedShopId],
    queryFn: () => categoriesApi.list(selectedShopId),
    enabled: !!selectedShopId,
  });

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ["resources", selectedShopId],
    queryFn: () => resourcesApi.list(selectedShopId),
    enabled: !!selectedShopId,
  });

  const createMutation = useMutation({
    mutationFn: (data: ResourceCreate) => resourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Tạo tài nguyên thành công!");
      closeModal();
    },
    onError: () => toast.error("Tạo tài nguyên thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResourceCreate> }) =>
      resourcesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Cập nhật tài nguyên thành công!");
      closeModal();
    },
    onError: () => toast.error("Cập nhật tài nguyên thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Xóa tài nguyên thành công!");
      setDeletingResource(null);
    },
    onError: () => toast.error("Xóa tài nguyên thất bại"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      resourcesApi.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: () => toast.error("Cập nhật trạng thái thất bại"),
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
      shop_id: selectedShopId,
      name: "",
      category_id: "",
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
      name: resource.name,
      category_id: resource.category_id || "",
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const shops: Shop[] = shopsData?.items || [];
  const categories = categoriesData?.items || [];

  // Filter resources by category
  const filteredResources = useMemo(() => {
    if (!resourcesData?.items) return [];
    if (!selectedCategoryId) return resourcesData.items;
    return resourcesData.items.filter(
      (resource) => resource.category_id === selectedCategoryId
    );
  }, [resourcesData?.items, selectedCategoryId]);

  return (
    <div className="resources-page animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Tài Nguyên</h1>
          <p className="page-subtitle">
            Quản lý tài nguyên và sản phẩm của cửa hàng
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={!selectedShopId}
        >
          <Plus size={18} />
          Tài Nguyên Mới
        </button>
      </div>

      <div className="filter-bar card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Chọn Cửa Hàng</label>
          <select
            className="form-input"
            value={selectedShopId}
            onChange={(e) => {
              setSelectedShopId(e.target.value);
              setSelectedCategoryId("");
            }}
          >
            <option value="">-- Chọn cửa hàng --</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
        {selectedShopId && categories.length > 0 && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Filter size={16} style={{ marginRight: 4 }} />
              Lọc theo Danh Mục
            </label>
            <select
              className="form-input"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">-- Tất cả danh mục --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedShopId ? (
        <div className="empty-state card">
          <Package size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Chọn một cửa hàng</h3>
          <p className="empty-state-text">
            Vui lòng chọn cửa hàng ở trên để xem và quản lý tài nguyên.
          </p>
        </div>
      ) : isLoading ? (
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      ) : filteredResources.length === 0 && selectedCategoryId ? (
        <div className="empty-state card">
          <Package size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Không có tài nguyên</h3>
          <p className="empty-state-text">
            Không tìm thấy tài nguyên nào trong danh mục này.
          </p>
        </div>
      ) : resourcesData?.items?.length === 0 ? (
        <div className="empty-state card">
          <Package size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Chưa có tài nguyên</h3>
          <p className="empty-state-text">
            Tạo tài nguyên đầu tiên để bắt đầu quản lý kho.
          </p>
          <button className="btn btn-primary mt-4" onClick={openCreateModal}>
            <Plus size={18} />
            Tạo Tài Nguyên
          </button>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh Mục</th>
                <th>Mô Tả</th>
                <th>Giá</th>
                <th style={{ width: 100 }}>Trạng Thái</th>
                <th style={{ width: 120 }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr
                  key={resource.id}
                  className={!resource.is_active ? "opacity-60" : ""}
                >
                  <td className="font-medium">{resource.name}</td>
                  <td>
                    {resource.category ? (
                      <span className="badge badge-info">
                        {resource.category.name}
                      </span>
                    ) : (
                      <span className="text-secondary">-</span>
                    )}
                  </td>
                  <td
                    className="text-secondary truncate"
                    style={{ maxWidth: 300 }}
                  >
                    {resource.description || "-"}
                  </td>
                  <td className="font-semibold">
                    {formatPrice(resource.price)}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${
                        resource.is_active 
                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      style={{
                        backgroundColor: resource.is_active ? '#dcfce7' : '#f3f4f6',
                        color: resource.is_active ? '#15803d' : '#6b7280',
                        border: resource.is_active ? '1px solid #86efac' : '1px solid #d1d5db',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: resource.id,
                          isActive: !resource.is_active,
                        })
                      }
                      title={
                        resource.is_active
                          ? "Hoạt động - Click để tắt"
                          : "Không hoạt động - Click để bật"
                      }
                    >
                      <Power size={18} />
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditModal(resource)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeletingResource(resource)}
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
                {editingResource ? "Sửa Tài Nguyên" : "Tạo Tài Nguyên"}
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
                  <label className="form-label">Tên</label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? "error" : ""}`}
                    placeholder="Tên tài nguyên"
                    {...register("name")}
                  />
                  {errors.name && (
                    <span className="form-error">{errors.name.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Danh Mục</label>
                  <select
                    className={`form-input ${
                      errors.category_id ? "error" : ""
                    }`}
                    {...register("category_id")}
                  >
                    <option value="">-- Không chọn danh mục --</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && selectedShopId && (
                    <p className="form-hint">
                      Chưa có danh mục. Vui lòng tạo danh mục trước.
                    </p>
                  )}
                  {errors.category_id && (
                    <span className="form-error">
                      {errors.category_id.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Giá (VND)</label>
                  <input
                    type="number"
                    className={`form-input ${errors.price ? "error" : ""}`}
                    placeholder="0"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && (
                    <span className="form-error">{errors.price.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Mô Tả</label>
                  <textarea
                    className="form-input"
                    placeholder="Mô tả tùy chọn"
                    rows={3}
                    {...register("description")}
                  />
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register("is_active")} />
                    <span className="form-label" style={{ marginBottom: 0 }}>
                      Hoạt động
                    </span>
                  </label>
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
                      {editingResource ? "Cập Nhật" : "Tạo"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingResource && (
        <div
          className="modal-overlay"
          onClick={() => setDeletingResource(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Xóa Tài Nguyên</h2>
              <button
                className="modal-close"
                onClick={() => setDeletingResource(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa{" "}
                <strong>{deletingResource.name}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingResource(null)}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={() => deleteMutation.mutate(deletingResource.id)}
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
