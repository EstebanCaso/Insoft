import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReplenishmentRequest } from '@/types';

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
      await sendN8NNotification(data);

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

  const sendN8NNotification = async (request: ReplenishmentRequest) => {
    try {
      // Configuración para n8n webhook
      const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
      
      if (!n8nWebhookUrl) {
        console.warn('N8N webhook URL no configurada');
        return;
      }

      const payload = {
        event: 'low_stock_replenishment_request',
        data: {
          request_id: request.id,
          product: request.product,
          supplier: request.supplier,
          quantity: request.quantity,
          requested_at: request.requestedAt,
          status: request.status,
        },
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error al enviar notificación a n8n: ${response.statusText}`);
      }

      console.log('Notificación enviada a n8n exitosamente');
    } catch (err) {
      console.error('Error al enviar notificación a n8n:', err);
      // No lanzamos el error para no interrumpir el flujo principal
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
    notes?: string
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

  return {
    loading,
    error,
    createReplenishmentRequest,
    getReplenishmentRequests,
    updateReplenishmentStatus,
  };
}; 