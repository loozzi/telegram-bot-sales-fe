import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Upload,
  Trash2,
  X,
  Check,
  FileUp,
  Package,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import { inventoriesApi, resourcesApi, shopsApi } from "../../api";
import type { Inventory, Shop, Resource } from "../../types";
import "./Inventories.css";

export function InventoriesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedShopId, setSelectedShopId] = useState<string>("");
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSold, setFilterSold] = useState<string>("all"); // 'all', 'sold', 'available'
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [deletingInventory, setDeletingInventory] = useState<Inventory | null>(
    null
  );
  const [selectedInventories, setSelectedInventories] = useState<Set<string>>(
    new Set()
  );

  const { data: shopsData } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsApi.list,
  });

  const { data: resourcesData } = useQuery({
    queryKey: ["resources", selectedShopId],
    queryFn: () => resourcesApi.list(selectedShopId),
    enabled: !!selectedShopId,
  });

  const { data: inventoriesData, isLoading } = useQuery({
    queryKey: ["inventories", selectedResourceId, searchQuery, filterSold],
    queryFn: () => {
      const isSold = filterSold === "all" ? undefined : filterSold === "sold";
      return inventoriesApi.list(
        selectedResourceId,
        1,
        100,
        searchQuery,
        isSold
      );
    },
    enabled: !!selectedResourceId,
  });

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
      toast.success(`Đã tải lên ${response.data?.total_created || 0} mục!`);
      setIsUploadModalOpen(false);
      setUploadFile(null);
    },
    onError: () => toast.error("Tải lên thất bại"),
  });

  const toggleSoldMutation = useMutation({
    mutationFn: ({ id, is_sold }: { id: string; is_sold: boolean }) =>
      inventoriesApi.update(id, { is_sold }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      toast.success("Cập nhật trạng thái thành công!");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => inventoriesApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      toast.success(`Đã xóa ${selectedInventories.size} mục!`);
      setSelectedInventories(new Set());
    },
    onError: () => toast.error("Xóa hàng loạt thất bại"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadFile(file);
  };

  const handleUpload = () => {
    if (uploadFile && selectedResourceId) {
      uploadMutation.mutate({
        resourceId: selectedResourceId,
        file: uploadFile,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInventories(new Set(inventories.map((i) => i.id)));
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

  const handleBulkDelete = () => {
    if (selectedInventories.size > 0) {
      bulkDeleteMutation.mutate(Array.from(selectedInventories));
    }
  };

  const shops: Shop[] = shopsData?.items || [];
  const resources: Resource[] = resourcesData?.items || [];
  const inventories: Inventory[] = inventoriesData?.items || [];
  const soldCount = inventories.filter((i) => i.is_sold).length;
  const availableCount = inventories.length - soldCount;

  return (
    <div className="inventories-page animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Kho Hàng</h1>
          <p className="page-subtitle">Quản lý các mục trong kho</p>
        </div>
        <div className="flex gap-2">
          {selectedInventories.size > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 size={18} />
              Xóa Đã Chọn ({selectedInventories.size})
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setIsUploadModalOpen(true)}
            disabled={!selectedResourceId}
          >
            <Upload size={18} />
            Tải Lên Hàng Loạt
          </button>
        </div>
      </div>

      <div className="filter-bar card">
        <div className="filters-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cửa Hàng</label>
            <select
              className="form-input"
              value={selectedShopId}
              onChange={(e) => {
                setSelectedShopId(e.target.value);
                setSelectedResourceId("");
                setSearchQuery("");
                setFilterSold("all");
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tài Nguyên</label>
            <select
              className="form-input"
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              disabled={!selectedShopId}
            >
              <option value="">-- Chọn tài nguyên --</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Tìm Kiếm</label>
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Tìm theo nội dung..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={!selectedResourceId}
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Trạng Thái</label>
            <select
              className="form-input"
              value={filterSold}
              onChange={(e) => setFilterSold(e.target.value)}
              disabled={!selectedResourceId}
            >
              <option value="all">Tất cả</option>
              <option value="available">Có sẵn</option>
              <option value="sold">Đã bán</option>
            </select>
          </div>
        </div>
      </div>

      {selectedResourceId && inventories.length > 0 && (
        <div className="inventory-stats">
          <div className="stat-badge available">
            <Boxes size={16} />
            <span>Có sẵn: {availableCount}</span>
          </div>
          <div className="stat-badge sold">
            <Check size={16} />
            <span>Đã bán: {soldCount}</span>
          </div>
        </div>
      )}

      {!selectedResourceId ? (
        <div className="empty-state card">
          <Package size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Chọn tài nguyên</h3>
          <p className="empty-state-text">
            Chọn cửa hàng và tài nguyên để xem các mục kho.
          </p>
        </div>
      ) : isLoading ? (
        <div className="page-loader">
          <div className="spinner spinner-lg" />
        </div>
      ) : inventories.length === 0 ? (
        <div className="empty-state card">
          <Boxes size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Không có mục kho</h3>
          <p className="empty-state-text">
            Tải lên tệp để thêm mục kho hàng loạt.
          </p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={18} />
            Tải Lên Tệp
          </button>
        </div>
      ) : (
        <div className="table-container card">
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
                <th>Nội dung</th>
                <th style={{ width: 120 }}>Trạng Thái</th>
                <th style={{ width: 80 }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((item) => (
                <tr key={item.id} className={item.is_sold ? "sold" : ""}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedInventories.has(item.id)}
                      onChange={(e) =>
                        handleSelectOne(item.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <code className="inventory-content">{item.content}</code>
                  </td>
                  <td>
                    <button
                      className={`status-toggle ${
                        item.is_sold ? "sold" : "available"
                      }`}
                      onClick={() =>
                        toggleSoldMutation.mutate({
                          id: item.id,
                          is_sold: !item.is_sold,
                        })
                      }
                    >
                      {item.is_sold ? "Đã bán" : "Có sẵn"}
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
