import React, { useState } from 'react';
import { Supplier, Product } from '@/types';

interface MultiReplenishmentModalProps {
  supplier: Supplier;
  products: Product[];
  onClose: () => void;
  onSubmit: (selectedProducts: { productId: string; name: string; quantity: number }[]) => void;
}

const MultiReplenishmentModal: React.FC<MultiReplenishmentModalProps> = ({
  supplier,
  products,
  onClose,
  onSubmit,
}) => {
  const [selected, setSelected] = useState<{ [id: string]: { selected: boolean; quantity: number } }>(
    Object.fromEntries(products.map(p => [p.id, { selected: false, quantity: Math.max(p.minStock * 2, 1) }]))
  );

  const handleCheck = (id: string, checked: boolean) => {
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], selected: checked } }));
  };

  const handleQuantity = (id: string, quantity: number) => {
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], quantity } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const toSend = products
      .filter(p => selected[p.id]?.selected)
      .map(p => ({
        productId: p.id,
        name: p.name,
        quantity: selected[p.id].quantity,
      }));
    if (toSend.length === 0) {
      alert('Selecciona al menos un producto');
      return;
    }
    onSubmit(toSend);
  };

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= 0) {
      return { status: 'Agotado', color: 'text-red-600', bg: 'bg-red-50' };
    } else if (product.currentStock <= product.minStock) {
      return { status: 'Bajo', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    } else {
      return { status: 'OK', color: 'text-green-600', bg: 'bg-green-50' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Solicitar Reabastecimiento a {supplier.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona los productos que necesitas reabastecer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={products.every(p => selected[p.id]?.selected)}
                      onChange={(e) => {
                        products.forEach(p => {
                          handleCheck(p.id, e.target.checked);
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Mínimo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad a solicitar
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => {
                  const stockStatus = getStockStatus(product);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected[product.id]?.selected || false}
                          onChange={e => handleCheck(product.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                          {product.currentStock} {product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {product.minStock} {product.unit}
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={1}
                          value={selected[product.id]?.quantity || 1}
                          onChange={e => handleQuantity(product.id, Number(e.target.value))}
                          className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!selected[product.id]?.selected}
                        />
                        <span className="text-sm text-gray-500 ml-1">{product.unit}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Enviar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MultiReplenishmentModal;
