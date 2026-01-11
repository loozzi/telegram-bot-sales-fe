import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Check,
  Download,
  Edit2,
  FileUp,
  Package,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { inventoriesApi } from "../../api/inventories";
import { resourcesApi } from "../../api/resources";
import { shopsApi } from "../../api/shops";
import { BackButton } from "../../components/BackButton/BackButton";
import type { Inventory, ResourceUpdate } from "../../types";
import "./ResourceDetail.css";

const resourceSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc").max(100),
  category_id: z.string().optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0, "Giá phải >= 0"),
  is_active: z.boolean().optional(),
});

type ResourceForm = z.infer<typeof resourceSchema>;

export function ResourceDetailPage() {
  const { shopId, resourceId } = useParams<{ shopId: string; resourceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Resource Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Inventories Management State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSold, setFilterSold] = useState<string>("all"); // 'all', 'sold', 'available'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [deletingInventory, setDeletingInventory] = useState<Inventory | null>(null);
  const [selectedInventories, setSelectedInventories] = useState<Set<string>>(new Set());
  const [uploadErrorLog, setUploadErrorLog] = useState<string | null>(null);

  // Data Queries
  const { data: shopData } = useQuery({
    queryKey: ["shop", shopId],
    queryFn: () => shopsApi.get(shopId!),
    enabled: !!shopId,
  });

  const { data: resourceData, isLoading: resourceLoading } = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => resourcesApi.get(resourceId!),
    enabled: !!resourceId,
  });

  const { data: inventoriesData } = useQuery({
    queryKey: ["inventories", resourceId, searchQuery, filterSold],
    queryFn: () => {
      const isSold = filterSold === "all" ? undefined : filterSold === "sold";
      return inventoriesApi.list(resourceId!, 1, 100, searchQuery, isSold);
    },
    enabled: !!resourceId,
  });

  // Resource Mutations
  const updateMutation = useMutation({
    mutationFn: (data: ResourceForm) => {
      const payload: ResourceUpdate = {
        ...data,
        category_id: data.category_id === "" ? null : data.category_id,
      };
      return resourcesApi.update(resourceId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", resourceId] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success("Cập nhật sản phẩm thành công!");
      setIsEditModalOpen(false);
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  // Inventory Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      toast.success("Xóa mục kho thành công!");
      setDeletingInventory(null);
    },
    onError: () => toast.error("Xóa thất bại"),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ resourceId, file }: { resourceId: string; file: File }) =>
      inventoriesApi.upload(resourceId, file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      const { total_created, total_errors, error_log_file } = response.data || {};

      if (total_errors && total_errors > 0) {
        toast.error(`Thêm ${total_created} mục, lỗi ${total_errors} mục!`);
        if (error_log_file) {
          setUploadErrorLog(error_log_file);
        }
      } else {
        toast.success(`Đã tải lên ${total_created || 0} mục!`);
        setUploadErrorLog(null);
      }
      setIsUploadModalOpen(false);
      setUploadFile(null);
    },
    onError: () => toast.error("Tải lên thất bại"),
  });

  const handleDownloadLog = async () => {
    if (!uploadErrorLog) return;
    try {
      const blob = await inventoriesApi.downloadErrorLog(uploadErrorLog);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", uploadErrorLog);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Không thể tải file log");
    }
  };


  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => inventoriesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      toast.success(`Đã xóa ${selectedInventories.size} mục!`);
      setSelectedInventories(new Set());
    },
    onError: () => toast.error("Xóa hàng loạt thất bại"),
  });

  // Forms
  const resourceForm = useForm<ResourceForm>({
    resolver: zodResolver(resourceSchema),
  });

  // Derived Data
  const shop = shopData?.data;
  const resource = resourceData?.data;
  const inventories = inventoriesData?.items || [];
  const soldCount = inventories.filter((i) => i.is_sold).length;
  const availableCount = inventories.length - soldCount;

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (uploadFile && resourceId) {
      uploadMutation.mutate({ resourceId, file: uploadFile });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = inventories.map((i) => i.id);
      setSelectedInventories(new Set(allIds));
    } else {
      setSelectedInventories(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedInventories);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedInventories(newSelected);
  };

  if (resourceLoading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!resource || !shop) {
    return (
      <div className="empty-state card">
        <Package size={64} className="empty-state-icon" />
        <h3 className="empty-state-title">Không tìm thấy sản phẩm</h3>
        <button
          className="btn btn-primary mt-4"
          onClick={() => navigate(`/shops/${shopId}/categories`)}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="resource-detail-page animate-fadeIn">
      <BackButton
        to={`/shops/${shopId}/categories`}
        label="Quay lại"
      />

      {/* Resource Header */}
      <div className="resource-header card">
        <div>
          <h1 className="page-title">{resource.name}</h1>
          {resource.description && (
            <p className="page-subtitle">{resource.description}</p>
          )}
          <div className="resource-meta">
            {resource.category && (
              <span className="badge badge-info">{resource.category.name}</span>
            )}
            {resource.is_active ? (
              <span className="badge badge-success">Hoạt động</span>
            ) : (
              <span className="badge badge-error">Không hoạt động</span>
            )}
            <span className="price">{resource.price.toLocaleString()} đ</span>
          </div>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            resourceForm.reset({
              name: resource.name,
              category_id: resource.category_id || "",
              description: resource.description || "",
              price: resource.price,
              is_active: resource.is_active,
            });
            setIsEditModalOpen(true);
          }}
        >
          <Edit2 size={18} />
          Chỉnh sửa
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-info">
            <p className="stat-label">Tổng trong kho</p>
            <p className="stat-value">{inventories.length}</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-info">
            <p className="stat-label">Còn lại</p>
            <p className="stat-value text-success">{availableCount}</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-info">
            <p className="stat-label">Đã bán</p>
            <p className="stat-value text-muted">{soldCount}</p>
          </div>
        </div>
      </div>

      {/* Inventory Management Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="section-title">Quản lý kho hàng</h2>
          <div className="flex gap-2">
            {uploadErrorLog && (
              <button
                className="btn btn-warning"
                onClick={handleDownloadLog}
                title="Tải xuống log lỗi của lần upload trước"
              >
                <Download size={18} />
                Log Lỗi
              </button>
            )}
            {selectedInventories.size > 0 && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Bạn có chắc muốn xóa ${selectedInventories.size} mục đã chọn?`
                    )
                  ) {
                    bulkDeleteMutation.mutate(Array.from(selectedInventories));
                  }
                }}
              >
                <Trash2 size={18} />
                Xóa ({selectedInventories.size})
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload size={18} />
              Tải Lên
            </button>
          </div>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              className="filter-select"
              value={filterSold}
              onChange={(e) => setFilterSold(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="available">Có sẵn</option>
              <option value="sold">Đã bán</option>
            </select>
          </div>
        </div>

        {inventories.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">
              {searchQuery
                ? "Không tìm thấy kết quả phù hợp."
                : "Chưa có hàng trong kho."}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedInventories.size === inventories.length &&
                        inventories.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th>Sản phẩm</th>
                  <th style={{ width: 140 }}>Trạng thái</th>
                  <th style={{ width: 140 }}>Ngày thêm</th>
                  <th style={{ width: 80 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {inventories.map((item) => (
                  <tr key={item.id} className={item.is_sold ? "sold" : ""} onClick={(e) => e.stopPropagation()}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInventories.has(item.id)}
                        onChange={(e) =>
                          handleSelectOne(item.id, e.target.checked)
                        }
                        disabled={item.is_sold}
                      />
                    </td>
                    <td>
                      <code className="inventory-content">{item.content}</code>
                    </td>
                    <td>
                      <button
                        className={`status-toggle gap-2 ${item.is_sold ? "sold" : "available"
                          }`}
                        disabled
                      >
                        {item.is_sold ? (
                          <>
                            <Check size={14} className="mr-2" /> Đã bán
                          </>
                        ) : (
                          <>
                            <Boxes size={14} className="mr-2" /> Đang bán
                          </>
                        )}
                      </button>
                    </td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDeletingInventory(item)}
                        disabled={item.is_sold}
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
      </div>

      {/* Edit Resource Modal */}
      {isEditModalOpen && resource && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Sửa sản phẩm</h2>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={resourceForm.handleSubmit((data) => updateMutation.mutate(data))}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm</label>
                  <input
                    type="text"
                    className={`form-input ${resourceForm.formState.errors.name ? "error" : ""}`}
                    {...resourceForm.register("name")}
                  />
                  {resourceForm.formState.errors.name && (
                    <span className="form-error">{resourceForm.formState.errors.name.message}</span>
                  )}
                </div>
                {/* <div className="form-group">
                  <label className="form-label">Gian hàng</label>
                  <select
                    className="form-input"
                    {...resourceForm.register("category_id")}
                  >
                    <option value="">Không có gian hàng</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div> */}
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
                    placeholder="Nhập mô tả"
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
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

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tải Lên Hàng Loạt</h2>
              <button
                className="modal-close"
                onClick={() => setIsUploadModalOpen(false)}
              >
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
                  {uploadFile
                    ? uploadFile.name
                    : "Thả tệp vào đây hoặc click để chọn"}
                </p>
                <p className="upload-hint">Tệp văn bản với mỗi mục trên một dòng</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Hủy
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
                    Tải Lên
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingInventory && (
        <div
          className="modal-overlay"
          onClick={() => setDeletingInventory(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Xóa Mục</h2>
              <button
                className="modal-close"
                onClick={() => setDeletingInventory(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>Xóa mục kho này?</p>
              <code className="delete-preview">
                {deletingInventory.content}
              </code>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeletingInventory(null)}
              >
                Hủy
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
