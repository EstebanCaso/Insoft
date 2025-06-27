import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReplenishmentRequest } from '@/types';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';

export const useReplenishment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();
  const {  } = useAuth();

  const createReplenishmentRequest = async (
    productId: string,
    quantity: number,
    supplierId: string
  ): Promise<ReplenishmentRequest | null> => {
    setLoading(true);
    setError(null);

    try {
      // Obtener el usuario actual
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (!supaUser || !profile) {
        throw new Error('Usuario o perfil no autenticado');
      }

      // Crear la solicitud de reabastecimiento
      const { data, error: insertError } = await supabase
        .from('replenishment_requests')
        .insert({
          product_id: productId,
          supplier_id: supplierId,
          quantity,
          status: 'pending',
          requested_by: supaUser.id,
          requested_at: new Date().toISOString(),
          profile_id: profile.id,
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
      if (!profile) {
        console.log('No profile available, returning empty array');
        return [];
      }
      
      console.log('Fetching replenishment requests for profile:', profile.id);
      
      // Primero intentar con profile_id, si falla, usar solo user_id
      let { data, error: fetchError } = await supabase
        .from('replenishment_requests')
        .select(`
          *,
          product:products(*),
          supplier:suppliers(*)
        `)
        .eq('profile_id', profile.id)
        .order('requested_at', { ascending: false });

      // Si hay error, intentar sin profile_id (para registros existentes)
      if (fetchError) {
        console.log('Error con profile_id, intentando sin filtro de perfil:', fetchError);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('replenishment_requests')
          .select(`
            *,
            product:products(*),
            supplier:suppliers(*)
          `)
          .eq('requested_by', user.id)
          .order('requested_at', { ascending: false });

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
        data = fallbackData;
      }

      console.log('Successfully fetched replenishment requests:', data?.length || 0);
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

  const createMultiReplenishmentRequest = async (
    supplierId: string,
    products: { productId: string; name: string; quantity: number }[]
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (!supaUser) throw new Error('Usuario no autenticado');

      // Crear una solicitud por cada producto para evitar problemas con la estructura
      const results = [];
      for (const product of products) {
        const { data, error: insertError } = await supabase
          .from('replenishment_requests')
          .insert({
            product_id: product.productId,
            supplier_id: supplierId,
            quantity: product.quantity,
            status: 'pending',
            requested_by: supaUser.id,
            requested_at: new Date().toISOString(),
            profile_id: profile?.id || null,
          })
          .select('*')
          .single();
        if (insertError) {
          console.error('Error inserting replenishment request:', insertError);
          throw insertError;
        }
        results.push(data);
      }
      return results;
    } catch (err: any) {
      console.error('Error in createMultiReplenishmentRequest:', err);
      setError(err.message || 'Error desconocido');
      return null;
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
    createMultiReplenishmentRequest,
  };
}; 