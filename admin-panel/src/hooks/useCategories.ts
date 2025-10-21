import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface Category {
  id: string;
  name_ru: string;
  name_tj: string;
  name_uz: string;
  description_ru?: string;
  description_tj?: string;
  description_uz?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const _categories = await apiClient.get('/categories/');
        /*
        const mockCategories: Category[] = [
          {
            id: '1',
            name_ru: 'Хлеб',
            name_tj: 'Нон',
            name_uz: 'Non',
            description_ru: 'Свежий хлеб различных сортов',
            description_tj: 'Нони тоза аз навъҳои гуногун',
            description_uz: 'Turli xil yangi nonlar',
            sort_order: 1,
            is_active: true,
            product_count: 12,
            created_at: '2024-01-15'
          },
          {
            id: '2',
            name_ru: 'Выпечка',
            name_tj: 'Кандолӣ',
            name_uz: 'Shirinliklar',
            description_ru: 'Сладкая выпечка и десерты',
            description_tj: 'Кандолиҳо ва ширинӣ',
            description_uz: 'Shirin pishiriqlar va desertlar',
            sort_order: 2,
            is_active: true,
            product_count: 8,
            created_at: '2024-01-15'
          },
          {
            id: '3',
            name_ru: 'Торты',
            name_tj: 'Тортҳо',
            name_uz: 'Tortlar',
            description_ru: 'Праздничные и обычные торты',
            description_tj: 'Тортҳои тӯйӣ ва оддӣ',
            description_uz: 'Bayram va oddiy tortlar',
            sort_order: 3,
            is_active: true,
            product_count: 6,
            created_at: '2024-01-15'
          }
        ];
        
        setCategories(mockCategories);*/
        setCategories(_categories);
        setLoading(false);
      } catch (err) {
        setError('Ошибка загрузки категорий');
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const createCategory = async (categoryData: Omit<Category, 'id' | 'created_at' | 'product_count'>) => {
    // Логика создания категории
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
      product_count: 0,
      created_at: new Date().toISOString()
    };
    await apiClient.post('/categories/create', newCategory);
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>) => {
    // Логика обновления категории
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...categoryData } : cat
    ));
  };

  const deleteCategory = async (id: string) => {
    // Логика удаления категории
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory
  };
};