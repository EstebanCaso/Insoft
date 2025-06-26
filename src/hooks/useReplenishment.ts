import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReplenishmentRequest } from '@/types';
import { notifyReorder } from '../utils/sendReorderRequest';

export const useReplenishment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReplenishmentRequest = async (
    productId: string,
    quantity: number,
    supplierId: string
  ): Promise<ReplenishmentRequest | null> => {
    setLoading(true);
    setError(null);

    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Crear la solicitud de reabastecimiento
      const { data, error: insertError } = await supabase
        .from('replenishment_requests')
        .insert({
          product_id: productId,
          supplier_id: supplierId,
          quantity,
          status: 'pending',
          requested_by: user.id,
          requested_at: new Date().toISOString(),
        })
        .select(`
          *,
          product:products(*),
          supplier:suppliers(*)
        `)
        .single();

      if (insertError) {
        throw insertError;
      }

      // Aquí podrías integrar con n8n para enviar la notificación
      await notifyReorder({
        providerPhone: data.supplier.phone,
        productName: data.product.name,
        quantity: data.quantity
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al crear solicitud de reabastecimiento:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReplenishmentRequests = async (): Promise<ReplenishmentRequest[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('replenishment_requests')
        .select(`
          *,
          product:products(*),
          supplier:suppliers(*)
        `)
        .order('requested_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al obtener solicitudes de reabastecimiento:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateReplenishmentStatus = async (
    requestId: string,
    status: ReplenishmentRequest['status'],
    notes?: string,
    productId?: string,
    quantity?: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        // Sumar al inventario si se aprueba
        if (productId && quantity) {
          // Obtener el producto actual
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', productId)
            .single();
          if (productError) throw productError;
          const newStock = (productData?.current_stock || 0) + quantity;
          await supabase
            .from('products')
            .update({ current_stock: newStock })
            .eq('id', productId);
        }
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('replenishment_requests')
        .update(updateData)
        .eq('id', requestId);

      if (updateError) {
        throw updateError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al actualizar estado de solicitud:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteReplenishmentRequest = async (requestId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('replenishment_requests')
        .delete()
        .eq('id', requestId);
      if (deleteError) {
        throw deleteError;
      }
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al eliminar solicitud de reabastecimiento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createReplenishmentRequest,
    getReplenishmentRequests,
    updateReplenishmentStatus,
    deleteReplenishmentRequest,
  };
}; 