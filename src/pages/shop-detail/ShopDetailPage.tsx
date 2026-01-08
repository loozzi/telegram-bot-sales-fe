import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Folder,
  Package,
  Settings,
  BarChart3,
  Bot,
  Edit2,
  Power,
  Plus,
  Trash2,
  X,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { shopsApi, categoriesApi, resourcesApi, botApi, paymentsApi } from "../../api";
import { Breadcrumb } from "../../components/Breadcrumb";
import type { Shop, Category, Resource, ShopUpdate, CategoryUpdate, ResourceUpdate, Payment, PaymentCreate, PaymentStatus, BankType } from "../../types";
import "./ShopDetail.css";

type TabType = "overview" | "categories" | "resources" | "settings";

const shopSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc").max(100).optional(),
  description: z.string().max(500).optional(),
  support_channel: z.string().max(500).optional(),
  support_group: z.string().max(500).optional(),
  policy: z.string().optional(),
  bot_token: z.string().min(1, "Bot token là bắt buộc").max(200).optional(),
  is_active: z.boolean().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  description: z.string().max(500).optional(),
});

const paymentSchema = z.object({
  bank_type: z.string().min(1, 'Vui lòng chọn ngân hàng'),
  bank_number: z.string().min(1, 'Số tài khoản là bắt buộc'),
  bank_name: z.string().optional(),
  account_name: z.string().optional(),
  token: z.string().optional(),
});

const BANK_OPTIONS: { value: BankType; label: string }[] = [
    { value: 'vcb', label: 'Vietcombank' },
    { value: 'tpb', label: 'TPBank' },
    { value: 'mb', label: 'MB Bank' },
    { value: 'acb', label: 'ACB' },
    { value: 'bidv', label: 'BIDV' },
    { value: 'tcb', label: 'Techcombank' },
    { value: 'vtb', label: 'VietinBank' },
    { value: 'seabank', label: 'SeABank' },
    { value: 'viettel', label: 'Viettel Money' },
    { value: 'msb', label: 'MSB' },
    { value: 'timo', label: 'Timo' },
    { value: 'vab', label: 'VietABank' },
];

const resourceSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Giá phải >= 0"),
  is_active: z.boolean().optional(),
});

type ShopForm = z.infer<typeof shopSchema>;
type CategoryForm = z.infer<typeof categorySchema>;
type ResourceForm = z.infer<typeof resourceSchema>;
type PaymentForm = z.infer<typeof paymentSchema>;

export function ShopDetailPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isEditShopModalOpen, setIsEditShopModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [showTokenId, setShowTokenId] = useState<string | null>(null);

  const { data: shopData, isLoading } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.get(shopId!),
    enabled: !!shopId,
  });

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

  const { data: paymentsData } = useQuery({
    queryKey: ["payments", shopId],
    queryFn: () => paymentsApi.list(shopId!),
    enabled: !!shopId,
  });

  const startBotMutation = useMutation({
    mutationFn: (shopId: string) => botApi.startMyBot(shopId),
    onSuccess: () => {
      toast.success("Bot đã khởi động!");
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
    },
    onError: () => toast.error("Khởi động bot thất bại"),
  });

  const stopBotMutation = useMutation({
    mutationFn: (shopId: string) => botApi.stopMyBot(shopId),
    onSuccess: () => {
      toast.success("Bot đã dừng!");
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
    },
    onError: () => toast.error("Dừng bot thất bại"),
  });

  const updateShopMutation = useMutation({
    mutationFn: (data: ShopUpdate) => shopsApi.update(shopId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop", shopId] });
      toast.success("Cập nhật shop thành công!");
      setIsEditShopModalOpen(false);
    },
    onError: () => toast.error("Cập nhật shop thất bại"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", shopId] });
      toast.success("Cập nhật danh mục thành công!");
      setEditingCategory(null);
    },
    onError: () => toast.error("Cập nhật danh mục thất bại"),
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceForm }) => {
      const payload: ResourceUpdate = {
        ...data,
        category_id: data.category_id === "" ? null : data.category_id,
      };
      return resourcesApi.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", shopId] });
      toast.success("Cập nhật tài nguyên thành công!");
      setEditingResource(null);
    },
    onError: () => toast.error("Cập nhật tài nguyên thất bại"),
  });

  // Payment Mutations
  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentCreate) => paymentsApi.create(shopId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
      toast.success("Thêm phương thức thanh toán thành công!");
      setIsPaymentModalOpen(false);
    },
    onError: () => toast.error("Thêm thất bại"),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentCreate> }) =>
      paymentsApi.update(shopId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
      toast.success("Cập nhật phương thức thanh toán thành công!");
      setIsPaymentModalOpen(false);
      setEditingPayment(null);
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.delete(shopId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
      toast.success("Xóa phương thức thanh toán thành công!");
      setDeletingPayment(null);
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  const togglePaymentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) =>
      paymentsApi.updateStatus(shopId!, id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", shopId] });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: () => toast.error("Cập nhật trạng thái thất bại"),
  });

  const shopForm = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
  });

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
  });

  const resourceForm = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
  });

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  // Reset form when editingPayment changes
  useEffect(() => {
    if (editingPayment) {
      paymentForm.reset({
        bank_type: editingPayment.bank_type,
        bank_number: editingPayment.bank_number,
        bank_name: editingPayment.bank_name || "",
        account_name: editingPayment.account_name || "",
        token: "",
      });
    } else {
      paymentForm.reset({
        bank_type: "",
        bank_number: "",
        bank_name: "",
        account_name: "",
        token: "",
      });
    }
  }, [editingPayment, paymentForm]);

  const shop: Shop | undefined = shopData?.data || undefined;
  const categories = categoriesData?.items || [];
  const resources = resourcesData?.items || [];
  const payments = paymentsData?.items || [];

  if (isLoading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="empty-state card">
        <Store size={64} className="empty-state-icon" />
        <h3 className="empty-state-title">Không tìm thấy cửa hàng</h3>
        <button className="btn btn-primary mt-4" onClick={() => navigate("/shops")}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: "Cửa hàng", path: "/shops" },
    { label: shop.name },
  ];

  return (
    <div className="shop-detail-page animate-fadeIn">
      <Breadcrumb items={breadcrumbItems} />

      {/* Shop Header */}
      <div className="shop-header card">
        <div className="shop-header-content">
          <div className="shop-icon-large">
            <Store size={32} />
          </div>
          <div className="shop-info-section">
            <h1 className="shop-name">{shop.name}</h1>
            {shop.description && (
              <p className="shop-description">{shop.description}</p>
            )}
            <div className="shop-meta-tags">
              {shop.is_active ? (
                <span className="badge badge-success">Hoạt động</span>
              ) : (
                <span className="badge badge-error">Không hoạt động</span>
              )}
              <span className="meta-item">
                <Bot size={14} />
                Bot Token: <code>{shop.bot_token.substring(0, 20)}...</code>
              </span>
            </div>
          </div>
        </div>
        <div className="shop-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() =>
              shop.is_active
                ? stopBotMutation.mutate(shop.id)
                : startBotMutation.mutate(shop.id)
            }
          >
            <Power size={16} />
            {shop.is_active ? "Dừng Bot" : "Khởi Động Bot"}
          </button>
          <button 
            className="btn btn-ghost btn-sm"
            onClick={() => {
              shopForm.reset({
                name: shop.name,
                description: shop.description || "",
                support_channel: shop.support_channel || "",
                support_group: shop.support_group || "",
                policy: shop.policy || "",
                bot_token: shop.bot_token,
                is_active: shop.is_active,
              });
              setIsEditShopModalOpen(true);
            }}
          >
            <Edit2 size={16} />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={18} />
            Tổng quan
          </button>
          <button
            className={`tab ${activeTab === "categories" ? "active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            <Folder size={18} />
            Danh mục ({categories.length})
          </button>
          <button
            className={`tab ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            <Package size={18} />
            Tài nguyên ({resources.length})
          </button>
          <button
            className={`tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <CreditCard size={18} />
            Phương thức thanh toán
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card card">
                <Folder size={24} className="stat-icon" />
                <div className="stat-info">
                  <p className="stat-label">Danh mục</p>
                  <p className="stat-value">{categories.length}</p>
                </div>
              </div>
              <div className="stat-card card">
                <Package size={24} className="stat-icon" />
                <div className="stat-info">
                  <p className="stat-label">Tài nguyên</p>
                  <p className="stat-value">{resources.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="categories-tab">
            <div className="tab-header">
              <h2>Danh mục sản phẩm</h2>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/shops/${shopId}/categories/new`)}
              >
                <Plus size={18} />
                Danh mục mới
              </button>
            </div>
            {categories.length === 0 ? (
              <div className="empty-state card">
                <Folder size={48} className="empty-state-icon" />
                <h3 className="empty-state-title">Chưa có danh mục</h3>
                <p className="empty-state-text">
                  Tạo danh mục để phân loại sản phẩm của bạn.
                </p>
              </div>
            ) : (
              <div className="table-container card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tên danh mục</th>
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
          </div>
        )}

        {activeTab === "resources" && (
          <div className="resources-tab">
            <div className="tab-header">
              <h2>Tài nguyên</h2>
              <button className="btn btn-primary">
                <Plus size={18} />
                Tài nguyên mới
              </button>
            </div>
            {resources.length === 0 ? (
              <div className="empty-state card">
                <Package size={48} className="empty-state-icon" />
                <h3 className="empty-state-title">Chưa có tài nguyên</h3>
                <p className="empty-state-text">
                  Tạo tài nguyên sản phẩm cho cửa hàng.
                </p>
              </div>
            ) : (
              <div className="table-container card">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Danh mục</th>
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
                            <span className="badge badge-success">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="badge badge-error">
                              Không hoạt động
                            </span>
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
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-tab">
            <div className="flex justify-between items-center mb-6">
              <h2 className="section-title">Phương thức thanh toán</h2>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingPayment(null);
                  setIsPaymentModalOpen(true);
                }}
              >
                <Plus size={18} />
                Thêm ngân hàng
              </button>
            </div>

            {payments.length === 0 ? (
              <div className="empty-state card">
                <CreditCard size={48} className="empty-state-icon" />
                <h3 className="empty-state-title">Chưa có phương thức thanh toán</h3>
                <p className="empty-state-text">Thêm tài khoản ngân hàng để nhận thanh toán từ khách hàng.</p>
                <button
                  className="btn btn-primary mt-4"
                  onClick={() => {
                    setEditingPayment(null);
                    setIsPaymentModalOpen(true);
                  }}
                >
                  <Plus size={18} />
                  Thêm tài khoản
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payments.map((payment) => (
                  <div key={payment.id} className={`card ${!payment.status || payment.status === 'suspended' ? 'opacity-75' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <CreditCard size={24} className="text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{BANK_OPTIONS.find(b => b.value === payment.bank_type)?.label || payment.bank_type}</h3>
                          <p className="text-sm text-secondary font-mono">{payment.bank_number}</p>
                        </div>
                      </div>
                      <button
                        className={`status-toggle ${payment.status === 'working' ? 'available' : 'sold'}`}
                        style={{ border: 'none', background: 'none', padding: 0 }}
                        onClick={() => togglePaymentStatusMutation.mutate({
                          id: payment.id,
                          status: payment.status === 'working' ? 'suspended' : 'working'
                        })}
                        title={payment.status === 'working' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {payment.status === 'working' ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} className="text-secondary" />}
                      </button>
                    </div>

                    <div className="space-y-3 mb-4">
                      {payment.account_name && (
                        <div className="flex justify-between text-sm">
                           <span className="text-secondary">Chủ tài khoản:</span>
                           <span className="font-medium">{payment.account_name}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-secondary">Token:</span>
                        <div className="flex items-center gap-2">
                           <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                             {showTokenId === payment.id ? "••••••••" : "••••••••"}
                           </code>
                           <button className="text-secondary hover:text-primary" onClick={() => setShowTokenId(showTokenId === payment.id ? null : payment.id)}>
                             {showTokenId === payment.id ? <EyeOff size={14} /> : <Eye size={14} />}
                           </button>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Trạng thái:</span>
                        {payment.status === "working" ? <span className="badge badge-success">Hoạt động</span> : <span className="badge badge-error">Tạm dừng</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        className="btn btn-secondary btn-sm flex-1"
                        onClick={() => {
                          setEditingPayment(payment);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        <Edit2 size={16} /> Sửa
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-error hover:bg-red-50"
                        onClick={() => setDeletingPayment(payment)}
                      >
                         <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Shop Modal */}
      {isEditShopModalOpen && shop && (
        <div className="modal-overlay" onClick={() => setIsEditShopModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Sửa Cửa Hàng</h2>
              <button className="modal-close" onClick={() => setIsEditShopModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={shopForm.handleSubmit((data) => updateShopMutation.mutate(data))}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên cửa hàng</label>
                  <input
                    type="text"
                    className={`form-input ${shopForm.formState.errors.name ? "error" : ""}`}
                    {...shopForm.register("name")}
                  />
                  {shopForm.formState.errors.name && (
                    <span className="form-error">{shopForm.formState.errors.name.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    {...shopForm.register("description")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bot Token</label>
                  <input
                    type="text"
                    className={`form-input ${shopForm.formState.errors.bot_token ? "error" : ""}`}
                    {...shopForm.register("bot_token")}
                  />
                  {shopForm.formState.errors.bot_token && (
                    <span className="form-error">{shopForm.formState.errors.bot_token.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Kênh hỗ trợ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@support_channel"
                    {...shopForm.register("support_channel")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nhóm hỗ trợ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="@support_group"
                    {...shopForm.register("support_group")}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Chính sách</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Chính sách sử dụng dịch vụ..."
                    {...shopForm.register("policy")}
                  />
                </div>
                <div className="form-group">
                  <div className="flex items-center gap-3">
                    <label className="toggle-switch">
                      <input type="checkbox" {...shopForm.register("is_active")} />
                      <span className="slider"></span>
                    </label>
                    <span>Hoạt động</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditShopModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateShopMutation.isPending}>
                  {updateShopMutation.isPending ? (
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                    <>
                      <Check size={18} />
                      Cập nhật
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Sửa Danh Mục</h2>
              <button className="modal-close" onClick={() => setEditingCategory(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={categoryForm.handleSubmit((data) => 
              updateCategoryMutation.mutate({ id: editingCategory.id, data })
            )}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên danh mục</label>
                  <input
                    type="text"
                    className={`form-input ${categoryForm.formState.errors.name ? "error" : ""}`}
                    {...categoryForm.register("name")}
                  />
                  {categoryForm.formState.errors.name && (
                    <span className="form-error">{categoryForm.formState.errors.name.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    {...categoryForm.register("description")}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingCategory(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateCategoryMutation.isPending}>
                  {updateCategoryMutation.isPending ? (
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                    <>
                      <Check size={18} />
                      Cập nhật
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Modal */}
      {editingResource && (
        <div className="modal-overlay" onClick={() => setEditingResource(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Sửa Tài Nguyên</h2>
              <button className="modal-close" onClick={() => setEditingResource(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={resourceForm.handleSubmit((data) => 
              updateResourceMutation.mutate({ id: editingResource.id, data })
            )}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên tài nguyên</label>
                  <input
                    type="text"
                    className={`form-input ${resourceForm.formState.errors.name ? "error" : ""}`}
                    {...resourceForm.register("name")}
                  />
                  {resourceForm.formState.errors.name && (
                    <span className="form-error">{resourceForm.formState.errors.name.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select
                    className="form-input"
                    {...resourceForm.register("category_id")}
                  >
                    <option value="">Không có danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Giá</label>
                  <input
                    type="number"
                    className={`form-input ${resourceForm.formState.errors.price ? "error" : ""}`}
                    {...resourceForm.register("price", { valueAsNumber: true })}
                  />
                  {resourceForm.formState.errors.price && (
                    <span className="form-error">{resourceForm.formState.errors.price.message}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    {...resourceForm.register("description")}
                  />
                </div>
                <div className="form-group">
                  <div className="flex items-center gap-3">
                    <label className="toggle-switch">
                      <input type="checkbox" {...resourceForm.register("is_active")} />
                      <span className="slider"></span>
                    </label>
                    <span>Hoạt động</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingResource(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateResourceMutation.isPending}>
                  {updateResourceMutation.isPending ? (
                    <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                    <>
                      <Check size={18} />
                      Cập nhật
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPayment ? 'Sửa phương thức thanh toán' : 'Thêm phương thức thanh toán'}
              </h2>
              <button className="modal-close" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={paymentForm.handleSubmit((data) => {
              if (editingPayment) {
                 const updatePayload: Partial<PaymentCreate> = {
                   bank_type: data.bank_type as BankType,
                   bank_number: data.bank_number,
                   bank_name: data.bank_name || undefined,
                   account_name: data.account_name || undefined,
                 };
                 if (data.token) {
                   updatePayload.token = data.token;
                 }
                 updatePaymentMutation.mutate({ id: editingPayment.id, data: updatePayload });
              } else {
                 createPaymentMutation.mutate({
                   ...data,
                   bank_type: data.bank_type as BankType,
                   token: data.token!,
                 });
              }
            })}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Ngân hàng</label>
                  <select
                    className={`form-input ${paymentForm.formState.errors.bank_type ? 'error' : ''}`}
                    {...paymentForm.register('bank_type')}
                  >
                    <option value="">Chọn ngân hàng</option>
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank.value} value={bank.value}>
                        {bank.label}
                      </option>
                    ))}
                  </select>
                  {paymentForm.formState.errors.bank_type && (
                     <span className="form-error">{paymentForm.formState.errors.bank_type.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Số tài khoản</label>
                  <input
                    type="text"
                    className={`form-input ${paymentForm.formState.errors.bank_number ? 'error' : ''}`}
                    placeholder="Nhập số tài khoản"
                    {...paymentForm.register('bank_number')}
                  />
                  {paymentForm.formState.errors.bank_number && (
                     <span className="form-error">{paymentForm.formState.errors.bank_number.message}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Chủ tài khoản</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tên chủ tài khoản"
                    {...paymentForm.register('account_name')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Chi nhánh / Tên gợi nhớ (Tùy chọn)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Chi nhánh hoặc tên tùy chỉnh"
                    {...paymentForm.register('bank_name')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                     Token {editingPayment ? '(để trống nếu không thay đổi)' : '(bắt buộc)'}
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={editingPayment ? 'Để trống để giữ nguyên' : 'API Token từ ngân hàng'}
                    {...paymentForm.register('token')}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}>
                  {createPaymentMutation.isPending || updatePaymentMutation.isPending ? (
                     <span className="spinner" style={{ width: 18, height: 18 }} />
                  ) : (
                     <>
                       <Check size={18} />
                       {editingPayment ? 'Cập nhật' : 'Thêm mới'}
                     </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {deletingPayment && (
        <div className="modal-overlay" onClick={() => setDeletingPayment(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Xóa phương thức thanh toán</h2>
              <button className="modal-close" onClick={() => setDeletingPayment(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa tài khoản <strong>{deletingPayment.bank_number}</strong> ({BANK_OPTIONS.find(b => b.value === deletingPayment.bank_type)?.label})?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingPayment(null)}>
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={() => deletePaymentMutation.mutate(deletingPayment.id)}
                disabled={deletePaymentMutation.isPending}
              >
                  {deletePaymentMutation.isPending ? (
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
