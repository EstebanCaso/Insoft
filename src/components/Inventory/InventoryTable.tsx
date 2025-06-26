import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Package, AlertTriangle, ShoppingCart, X } from 'lucide-react';
import { Product, Supplier } from '@/types';
import ProductModal from '@/components/Inventory/ProductModal';
import ReplenishmentModal from '@/components/Inventory/ReplenishmentModal';

interface InventoryTableProps {
  products: Product[];
  suppliers: Supplier[];
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onRequestReplenishment?: (productId: string, quantity: number, supplierId: string) => Promise<void>;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRequestReplenishment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isReplenishmentModalOpen, setIsReplenishmentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickReplenishProduct, setQuickReplenishProduct] = useState<Product | null>(null);

  useEffect(() => {
    const lowStockProduct = products.find(
      (product) => product.currentStock > 0 && product.currentStock <= product.minStock
    );
    if (lowStockProduct) {
      setQuickReplenishProduct(lowStockProduct);
    } else {
      setQuickReplenishProduct(null);
    }
  }, [products]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleSave = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      onDeleteProduct(id);
    }
  };

  const handleRequestReplenishment = (product: Product) => {
    setSelectedProduct(product);
    setIsReplenishmentModalOpen(true);
  };

  const handleReplenishmentSubmit = async (productId: string, quantity: number, supplierId: string) => {
    if (onRequestReplenishment) {
      await onRequestReplenishment(productId, quantity, supplierId);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= 0) {
      return { status: 'out', color: 'text-red-600', bg: 'bg-gradient-to-r from-red-50 to-red-100' };
    } else if (product.currentStock <= product.minStock) {
      return { status: 'low', color: 'text-yellow-600', bg: 'bg-gradient-to-r from-yellow-50 to-orange-50' };
    } else {
      return { status: 'good', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-50 to-emerald-50' };
    }
  };

  const getSupplier = (product: Product) => {
    return suppliers.find(s => s.id === product.supplierId);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {quickReplenishProduct && (
        <div className="fixed top-8 right-8 z-50">
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg p-6 flex items-center space-x-4 animate-bounce-in">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div>
              <div className="font-bold text-yellow-900 mb-1">¡Stock bajo detectado!</div>
              <div className="text-gray-800 mb-2">
                <span className="font-semibold">{quickReplenishProduct.name}</span> tiene solo <span className="font-semibold">{quickReplenishProduct.currentStock} {quickReplenishProduct.unit}</span> (mínimo: {quickReplenishProduct.minStock})
              </div>
              <button
                className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white px-4 py-2 rounded-md font-semibold shadow hover:from-orange-500 hover:to-yellow-600 transition-all duration-200 transform hover:scale-105"
                onClick={() => {
                  setSelectedProduct(quickReplenishProduct);
                  setIsReplenishmentModalOpen(true);
                  setQuickReplenishProduct(null);
                }}
              >
                Reabastecer ahora
              </button>
            </div>
            <button
              className="ml-2 text-yellow-700 hover:text-yellow-900"
              onClick={() => setQuickReplenishProduct(null)}
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Inventario</h2>
          <button
            onClick={handleAdd}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-500 mb-4">Comienza agregando productos a tu inventario</p>
          <button
            onClick={handleAdd}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Agregar Primer Producto
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                const supplier = getSupplier(product);
                const showReplenishmentButton = stockStatus.status === 'low' || stockStatus.status === 'out';
                
                return (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                          {product.currentStock} {product.unit}
                        </span>
                        {stockStatus.status !== 'good' && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.minStock} {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier?.name || 'Sin proveedor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar producto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {showReplenishmentButton && supplier && (
                          <button
                            onClick={() => handleRequestReplenishment(product)}
                            className="text-orange-600 hover:text-orange-900 transition-colors"
                            title="Solicitar reabastecimiento"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          suppliers={suppliers}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {isReplenishmentModalOpen && selectedProduct && (
        <ReplenishmentModal
          product={selectedProduct}
          supplier={getSupplier(selectedProduct)!}
          onClose={() => {
            setIsReplenishmentModalOpen(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleReplenishmentSubmit}
        />
      )}
    </div>
  );
};

export default InventoryTable;