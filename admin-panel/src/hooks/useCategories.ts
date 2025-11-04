import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface Category {
  id?: string;
  name_ru?: string;
  name_tj?: string;
  name_uz?: string;
  description_ru?: string;
  description_tj?: string;
  description_uz?: string;
  image_url?: string;
  sort_order?: number;
  is_active: boolean;
  product_count?: number;
  created_at?: string;
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

  const createCategory = async (categoryData: FormData  | Omit<Category, 'id' | 'created_at' | 'product_count'>) => {
    // Логика создания категории
    let newCategory: Category;
    if (categoryData instanceof FormData) {
      // Здесь будет реальный API вызов с FormData
      console.log('Creating category with image:', categoryData);
      
      // Временная имитация создания категории
      newCategory = {
        id: Date.now().toString(),
        name_ru: categoryData.get('name_ru') as string,
        name_tj: categoryData.get('name_tj') as string,
        name_uz: categoryData.get('name_uz') as string,
        description_ru: categoryData.get('description_ru') as string,
        description_tj: categoryData.get('description_tj') as string,
        description_uz: categoryData.get('description_uz') as string,
        sort_order: parseInt(categoryData.get('sort_order') as string),
        is_active: categoryData.get('is_active') === 'true',
        product_count: 0,
        created_at: new Date().toISOString()
      };
      
      //setCategories(prev => [...prev, newCategory]);
    } else {
      newCategory = {
        ...categoryData,
        //id: Date.now().toString(),
        product_count: 0,
        created_at: new Date().toISOString()
      };
    }
  
    let response = await apiClient.post('/categories/create', categoryData);
    setCategories(prev => [...prev, response.data]);
    return response;
  };

  const updateCategory = async (id: string, categoryData: FormData  | Partial<Category>) => {
    let upCategory: Category;
    let response;
    // Логика обновления категории
    if (categoryData instanceof FormData) {
      // Здесь будет реальный API вызов с FormData
      response = await apiClient.post(`/categories/update/${id}`, categoryData);
      // Временная имитация создания категории
      //setCategories(prev => [...prev, upCategory]);
      //return upCategory;
    } else {
      upCategory = {
        ...categoryData,
        //id: Date.now().toString(),
        is_active: categoryData.is_active === true,
        product_count: 0,
        created_at: new Date().toISOString()
      };
    response = await apiClient.post(`/categories/update/${id}`, categoryData);
    }
    const updatedCategory = response.data;
      setCategories(prev => prev.map(cat => 
        cat.id == id ? updatedCategory : cat
      ));
      return updatedCategory;
    //await apiClient.post(`/categories/update/${id}`, upCategory);
  };
  
  const deleteCategory = async (id: string) => {
    // Логика удаления категории
    await apiClient.post(`/categories/delete/${id}`);
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