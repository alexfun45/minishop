import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface Product {
  id: string;
  name_ru: string;
  name_tj: string;
  name_uz: string;
  description_ru: string;
  description_tj: string;
  description_uz: string;
  price: string;
  old_price: string;
  category_id: string;
  weight: string;
  ingredients_ru: string;
  ingredients_tj: string;
  ingredients_uz: string;
  available: boolean;
}

export const useProduct = () => {
  const [product, setProduct] = useState();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        
      } catch (err) {
        setError('Ошибка загрузки продукта');
      }
    }
}, []);

}