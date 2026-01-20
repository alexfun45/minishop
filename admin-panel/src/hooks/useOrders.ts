import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import type {Order} from '../types/index'

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const _orders = await apiClient.get('/orders/');
        setOrders(_orders.data);
        setLoading(false);
      } catch (err) {
        setError('Ошибка загрузки категорий');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateOrder= async (id: number, orderData: FormData  | Partial<Order>) => {
    
    let response;
    // Логика обновления категории
    if (orderData instanceof FormData) {
      // Здесь будет реальный API вызов с FormData
      response = await apiClient.post(`/order/update/${id}`, orderData);
      // Временная имитация создания категории
      //setCategories(prev => [...prev, upCategory]);
      //return upCategory;
    } 
    const updatedCategory = response.data;
      setOrders(prev => prev.map(order => 
        order.id == id ? updatedCategory : order
      ));
      return updatedCategory;
    //await apiClient.post(`/categories/update/${id}`, upCategory);
  };

  const deleteOrder = async (id: number) => {
    // Логика удаления категории
    await apiClient.post(`/order/delete/${id}`);
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