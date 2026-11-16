import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import type {Order} from '../types/index'

const POLLING_INTERVAL_MS = 5000;

/*export interface Order {
  id: number;
  user_id: number;
  telegram_id: number;
  total_amount: number;
  status: string;
  delivery_address: string;
  delivery_time: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
  payment_status: string;
  notes: string;
  delivery_lat: string;
  delivery_lng: string;
}*/

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const _orders = await apiClient.get('/orders/');
      const freshOrders: Order[] = _orders.data || _orders || [];
      setOrders((prevOrders) => {
        if (JSON.stringify(prevOrders) === JSON.stringify(freshOrders)) {
          return prevOrders;
        }
        return freshOrders;
      });

      //setOrders(_orders.data);
      
    } catch (err) {
      setError('Ошибка загрузки заказов');
      setLoading(false);
    }
    finally {
      if (!silent) setLoading(false);
    }
  }, []  )

  useEffect(() => {
    fetchOrders(false);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    }, POLLING_INTERVAL_MS);

    // 3. Мгновенное обновление при возвращении на вкладку браузера
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOrders]);

  const updateOrder= async (id: number, orderData: string) => {
    
    let response;
    // Логика обновления категории
    //if (orderData instanceof FormData) {
      // Здесь будет реальный API вызов с FormData
      response = await apiClient.put(`/order/update/${id}`, {'status': orderData});
      // Временная имитация создания категории
      //setCategories(prev => [...prev, upCategory]);
      //return upCategory;
    //} 
    const updatedCategory = response.data;
      setOrders(prev => prev.map(order => 
        order.id == id ? updatedCategory : order
      ));
      return updatedCategory;
    //await apiClient.post(`/categories/update/${id}`, upCategory);
  };

  const deleteOrder = async (id: number) => {
    // Логика удаления категории
    await apiClient.get(`/order/delete/${id}`);
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  return {
    orders,
    loading,
    error,
    updateOrder,
    deleteOrder
  };

}