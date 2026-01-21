import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import type { ActivityType } from '../../types/index';

export const Activity = () => {

  const [activities, setActivities] = useState<ActivityType[] | []>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getEventString = (event_name: string, data: string) => {
    switch(event_name){
      case 'create new product':
        return '📦 Добавлен новый товар';
      case 'create new order':
        return `📋 Добавлен новый заказ #${data}`;
      case 'update order':
        return `🔄 Статус заказа #${data} изменен`;
      case 'update product':
        return `🔄 Товар #${data} изменен`;
    }
  }

  useEffect(()=>{
    const fetchRecentActivity = async () => {
      try{
        const acts = await apiClient.get('/activity/');
        setActivities(acts.data);
        setLoading(false);
      } catch(e){
        setError('Ошибка загрузки категорий');
        setLoading(false);
      }
    }
    fetchRecentActivity();
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Активность</h3>
            <div className="space-y-2 text-sm">
              {
              activities.map((v: ActivityType)=>(
                  <div>{getEventString(v.event_name, v.data)}</div>
              ))             
              }
              {/*<div>✅ Новый заказ #1003</div>
              <div>🔄 Статус заказа #1001 изменен</div>
              <div>📦 Добавлен новый товар</div>
            */}
            </div>
          </div>
  )
}