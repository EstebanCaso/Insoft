import React, { useState, useEffect } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import InventoryTable from '../Inventory/InventoryTable';
import SuppliersTable from '../Suppliers/SuppliersTable';
import DayClosing from '../Closing/DayClosing';
import ReportsView from '../Reports/ReportsView';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const { user } = useAuth();
  const {
    products,
    suppliers,
    sales,
    alerts,
    isLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    recordSales,
    loadData,
  } = useInventory();

  // Efecto para crear proveedor default si no hay ninguno
  useEffect(() => {
    if (user && !isLoading) {
      // Verifica si existe un proveedor con nombre 'default_'
      const hasDefault = suppliers.some(s => s.name === 'default_');
      if (!hasDefault) {
        const defaultSupplier = {
          name: 'default_',
          contact: user.user_metadata?.username || user.email || 'Administrador',
          phone: '',
          email: user.email || '',
          address: '',
        };
        addSupplier(defaultSupplier).then(() => {
          loadData();
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, suppliers, isLoading]);

  // Título dinámico según la pestaña activa
  const tabTitles: Record<string, string> = {
    inventory: 'Inventario',
    suppliers: 'Proveedores',
    closing: 'Cierre del Día',
    reports: 'Reportes',
  };
  const currentTitle = tabTitles[activeTab] || 'Dashboard';

  // Función para ir a reportes
  const goToReports = () => setActiveTab('reports');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <InventoryTable
            products={products}
            suppliers={suppliers}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        );
      case 'suppliers':
        return (
          <SuppliersTable
            suppliers={suppliers}
            onAddSupplier={addSupplier}
            onUpdateSupplier={updateSupplier}
            onDeleteSupplier={deleteSupplier}
          />
        );
      case 'closing':
        return (
          <DayClosing
            products={products}
            onRecordSale={recordSales}
          />
        );
      case 'reports':
        return (
          <ReportsView
            products={products}
            sales={sales}
            alerts={alerts}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header alerts={alerts} title={currentTitle} onGoToReports={goToReports} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;