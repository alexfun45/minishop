import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface Category {
  id?: string;
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
        setCategories(_categories.data);
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
      //id: Date.now().toString(),
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