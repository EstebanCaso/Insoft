import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Product, Sale } from '../../types';

interface SaleModalProps {
  products: Product[];
  onSave: (sales: Omit<Sale, 'id'>[]) => void;
  onClose: () => void;
}

interface SaleLine {
  productId: string;
  quantity: number;
}

const SaleModal: React.FC<SaleModalProps> = ({ products, onSave, onClose }) => {
  const [lines, setLines] = useState<SaleLine[]>([
    { productId: '', quantity: 1 },
  ]);

  const handleLineChange = (idx: number, field: keyof SaleLine, value: string | number) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === idx ? { ...line, [field]: value } : line
      )
    );
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter(
      (line) => line.productId && line.quantity > 0 &&
        products.find((p) => p.id === line.productId && p.currentStock >= line.quantity)
    );
    if (validLines.length === 0) return;
    const sales: Omit<Sale, 'id'>[] = validLines.map((line) => {
      const product = products.find((p) => p.id === line.productId)!;
      return {
        productId: line.productId,
        quantity: line.quantity,
        date: new Date(),
        totalValue: line.quantity * product.unitPrice,
      };
    });
    onSave(sales);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Registrar Ventas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {lines.map((line, idx) => {
            const selectedProduct = products.find((p) => p.id === line.productId);
            const maxQuantity = selectedProduct ? selectedProduct.currentStock : 0;
            return (
              <div key={idx} className="flex items-end space-x-2 border-b pb-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                  <select
                    value={line.productId}
                    onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Selecciona un producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (Stock: {product.currentStock} {product.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    min="1"
                    max={maxQuantity}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Máx: {maxQuantity}</p>
                </div>
                <button type="button" onClick={() => handleRemoveLine(idx)} className="text-red-500 hover:text-red-700 ml-2 mb-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          <button type="button" onClick={handleAddLine} className="flex items-center text-orange-600 hover:text-orange-800 font-medium">
            <Plus className="w-4 h-4 mr-1" /> Agregar otro producto
          </button>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Registrar Ventas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleModal;