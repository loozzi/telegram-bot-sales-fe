import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Folder, Plus, Trash2, X, Package, Eye, ToggleLeft, ToggleRight, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { categoriesApi, resourcesApi } from "../../../api";
import type { Category, CategoryCreate, CategoryUpdate, Resource, ResourceCreate } from "../../../types";
import "../ShopDetail.css";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Schemas ---
const categorySchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  description: z.string().max(500).optional(),
});

const resourceSchema = z.object({
  shop_id: z.string(),
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Giá phải là số dương"),
  is_active: z.boolean().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;
type ResourceForm = z.infer<typeof resourceSchema>;

function SortableRow({ children, id }: { children: React.ReactNode; id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : "auto",
    position: isDragging ? "relative" : ("static" as any),
    cursor: "move",
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "bg-base-200 opacity-50" : "hover:bg-base-200 group cursor-move"}
    >
      {children}
    </tr>
  );
}

export function ShopCategories() {
  const { shopId } = useParams<{ shopId: string }>();
  // navigate unused, but kept if needed for deep links later or removed if strictly modal
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- State ---
  // Category CRUD
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Category Details (Product List)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // DnD Local State
  const [items, setItems] = useState<Category[]>([]);

  // Resource CRUD
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // --- Queries ---
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", shopId],
    queryFn: () => categoriesApi.list(shopId!),
    enabled: !!shopId,
  });

  // Sync items with query data
  useEffect(() => {
    if (categoriesData?.items) {
      setItems(categoriesData.items);
    }
  }, [categoriesData]);

  const { data: resourcesData } = useQuery({
    queryKey: ["resources", shopId, selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return { items: [] };
      const res = await categoriesApi.get(selectedCategory.id);
      return { items: res?.data?.resources || [] };
    },
    enabled: !!selectedCategory?.id,
    placeholderData: keepPreviousData,
  });

  // Sort resources by created_at descending (newest first)
  // No sort, display as response
  const resources = resourcesData?.items || [];

  // --- Forms ---
  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const resourceForm = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
  });

  // --- Mutations (Categories) ---
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

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
      toast.success("Xóa gian hàng thành công!");
    },
    onError: () => toast.error("Xóa gian hàng thất bại"),
  });

  const toggleCategoryStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      categoriesApi.toggleActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: (newItems: Category[]) => {
      return categoriesApi.reorder(shopId!, newItems.map((item) => item.id));
    },
    onSuccess: () => {
      // Optimistic update
    },
    onError: () => {
      toast.error("Cập nhật thứ tự thất bại");
      queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
    },
  });

  // --- Mutations (Resources) ---
  const createResourceMutation = useMutation({
    mutationFn: (data: ResourceCreate) => resourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", shopId, selectedCategory?.id] });
      toast.success("Tạo sản phẩm thành công!");
      setIsResourceModalOpen(false);
      resourceForm.reset();
    },
    onError: () => toast.error("Tạo sản phẩm thất bại"),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResourceCreate> }) => {
      const payload = { ...data, category_id: data.category_id || null };
      return resourcesApi.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", shopId, selectedCategory?.id] });
      toast.success("Cập nhật sản phẩm thành công!");
      setEditingResource(null);
      setIsResourceModalOpen(false);
    },
    onError: () => toast.error("Cập nhật sản phẩm thất bại"),
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => resourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", shopId, selectedCategory?.id] });
      toast.success("Xóa sản phẩm thành công!");
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  const toggleResourceStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      resourcesApi.updateStatus(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", shopId, selectedCategory?.id] });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });


  // --- Handlers ---
  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({ name: category.name, description: category.description || "" });
    } else {
      setEditingCategory(null);
      categoryForm.reset({ name: "", description: "" });
    }
    setIsCategoryModalOpen(true);
  };

  const openResourceModal = (resource?: Resource) => {
    if (resource) {
      setEditingResource(resource);
      resourceForm.reset({
        shop_id: resource.shop_id,
        category_id: resource.category_id || selectedCategory?.id || "",
        name: resource.name,
        description: resource.description || "",
        price: resource.price,
        is_active: resource.is_active,
      });
    } else {
      setEditingResource(null);
      resourceForm.reset({
        shop_id: shopId!,
        category_id: selectedCategory?.id,
        name: "",
        description: "",
        price: 0,
        is_active: true,
      });
    }
    setIsResourceModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        reorderCategoriesMutation.mutate(newItems);
        return newItems;
      });
    }
  };


  // --- Modals ---
  const Modals = () => (
    <>
      {/* Category CRUD Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCategory ? "Chỉnh sửa gian hàng" : "Thêm gian hàng mới"}
              </h2>
              <button className="modal-close" onClick={() => setIsCategoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={categoryForm.handleSubmit((data) => {
                if (editingCategory) {
                  updateCategoryMutation.mutate({ id: editingCategory.id, data: { ...data } });
                } else {
                  createCategoryMutation.mutate({ ...data, shop_id: shopId! });
                }
              })}
            >
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên gian hàng</label>
                  <input
                    {...categoryForm.register("name")}
                    className="form-input"
                    placeholder="Ví dụ: Netflix, Spotify..."
                  />
                  {categoryForm.formState.errors.name && (
                    <span className="form-error">{categoryForm.formState.errors.name.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    {...categoryForm.register("description")}
                    className="form-textarea"
                    placeholder="Mô tả ngắn về gian hàng..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {editingCategory ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Details (Resources List) Modal */}
      {selectedCategory && !isResourceModalOpen && (
        <div className="modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="modal modal-lg text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedCategory.name}</h2>
                {selectedCategory.description && <p className="text-sm text-secondary">{selectedCategory.description}</p>}
              </div>
              <button className="modal-close" onClick={() => setSelectedCategory(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="flex justify-between items-center mb-4">
                <h3 className="section-title">Danh sách sản phẩm</h3>
                <button className="btn btn-primary btn-sm" onClick={() => openResourceModal()}>
                  <Plus size={16} /> Thêm sản phẩm
                </button>
              </div>

              {resources.length === 0 ? (
                <div className="empty-state py-8">
                  <Package size={48} className="empty-state-icon mx-auto mb-2 opacity-50" />
                  <p className="text-center text-secondary">Chưa có sản phẩm nào trong gian hàng này.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Giá</th>
                        <th>Trạng thái</th>
                        <th>Số lượng</th>
                        <th style={{ width: 100 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((res: any) => (
                        <tr key={res.id} className="hover:bg-base-200">
                          <td>
                            <div className="font-medium truncate max-w-[120px]">{res.name.slice(0, 24) + (res.name.length > 24 ? '...' : '')}</div>
                            <div className="text-xs text-secondary truncate max-w-[120px]">{res.description.slice(0, 24) + (res.description.length > 24 ? '...' : '')}</div>
                          </td>
                          <td>{res.price?.toLocaleString()} đ</td>
                          <td>
                            <button
                              className={`status-toggle ${res.is_active ? "available" : "sold"
                                }`}
                              style={{ border: "none", background: "none", padding: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleResourceStatusMutation.mutate({
                                  id: res.id,
                                  is_active: !res.is_active,
                                });
                              }}
                              title={res.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                            >
                              {res.is_active ? (
                                <ToggleRight size={28} className="text-success" />
                              ) : (
                                <ToggleLeft size={28} className="text-secondary" />
                              )}
                            </button>
                          </td>
                          <td>{res.total_inventory}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button
                                className="btn btn-ghost btn-sm tooltip"
                                data-tip="Xem chi tiết"
                                onClick={() => navigate(`/shops/${shopId}/resources/${res.id}`)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm tooltip"
                                data-tip="Chỉnh sửa"
                                onClick={() => openResourceModal(res)}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm text-error tooltip"
                                data-tip="Xóa sản phẩm"
                                onClick={() => {
                                  if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
                                    deleteResourceMutation.mutate(res.id);
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCategory(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Resource CRUD Modal */}
      {isResourceModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResourceModalOpen(false)}>
          <div className="modal text-left" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingResource ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h2>
              <button className="modal-close" onClick={() => setIsResourceModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={resourceForm.handleSubmit((data) => {
              if (editingResource) {
                updateResourceMutation.mutate({ id: editingResource.id, data });
              } else {
                createResourceMutation.mutate(data);
              }
            })}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm</label>
                  <input {...resourceForm.register("name")} className="form-input" />
                  {resourceForm.formState.errors.name && <span className="form-error">{resourceForm.formState.errors.name.message}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea {...resourceForm.register("description")} className="form-textarea" rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá</label>
                  <input type="number" {...resourceForm.register("price", { valueAsNumber: true })} className="form-input" />
                  {resourceForm.formState.errors.price && <span className="form-error">{resourceForm.formState.errors.price.message}</span>}
                </div>
                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...resourceForm.register("is_active")} />
                    <span>Hoạt động</span>
                  </label>
                </div>
                <input type="hidden" {...resourceForm.register("category_id")} />
                <input type="hidden" {...resourceForm.register("shop_id")} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsResourceModalOpen(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={createResourceMutation.isPending || updateResourceMutation.isPending}>
                  {editingResource ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="categories-tab animate-fadeIn">
      <div className="tab-header">
        <h2>Gian hàng</h2>
        <button className="btn btn-primary" onClick={() => openCategoryModal()}>
          <Plus size={18} />
          Gian hàng mới
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state card">
          <Folder size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">Chưa có gian hàng</h3>
          <p className="empty-state-text">
            Tạo gian hàng để phân loại sản phẩm của bạn.
          </p>
        </div>
      ) : (
        <div className="table-container card">
          <div className="px-4 py-2 text-xs text-secondary italic border-b border-base-200 bg-base-100 flex items-center gap-1">
            <GripVertical size={14} />
            <span>Kéo thả vào biểu tượng để thay đổi thứ tự hiển thị gian hàng</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Tên gian hàng</th>
                  <th>Mô tả</th>
                  <th>Sản phẩm</th>
                  <th>Kho</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 120 }}>Hành động</th>
                </tr>
              </thead>
              <SortableContext
                items={items.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {items.map((category) => (
                    <SortableRow key={category.id} id={category.id}>
                      <td className="cursor-move text-secondary hover:text-primary transition-colors" style={{cursor: "move"}}>
                        <GripVertical size={20} />
                      </td>
                      <td className="font-medium">{category.name}</td>
                      <td className="text-secondary truncate">
                        {category.description || "-"}
                      </td>
                      <td>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">{category.active_resource_count} đang bán</span>
                          <span className="text-secondary">Tổng: {category.resource_count}</span>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">{category.inventory_quantity}</div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()} className="cursor-default">
                        <button
                          className={`status-toggle ${category.is_active ? "available" : "sold"
                            }`}
                          style={{ border: "none", background: "none", padding: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryStatusMutation.mutate({
                              id: category.id,
                              is_active: !category.is_active,
                            });
                          }}
                          title={category.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                        >
                          {category.is_active ? (
                            <ToggleRight size={28} className="text-success" />
                          ) : (
                            <ToggleLeft size={28} className="text-secondary" />
                          )}
                        </button>
                      </td>
                      <td onClick={(e) => e.stopPropagation()} className="cursor-default">
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm tooltip"
                            data-tip="Xem chi tiết"
                            onClick={() => setSelectedCategory(category)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm tooltip"
                            data-tip="Chỉnh sửa"
                            onClick={() => openCategoryModal(category)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-error tooltip"
                            data-tip="Xóa gian hàng"
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Bạn có chắc chắn muốn xóa gian hàng này? Tất cả sản phẩm trong gian hàng cũng sẽ bị xóa."
                                )
                              ) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
      <Modals />
    </div>
  );
}
