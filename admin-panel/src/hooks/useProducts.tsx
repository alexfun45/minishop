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

export const useProducts = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res: any = await apiClient.get('/products/');
        setProducts(res.data);
      } catch (err) {
        setError('Ошибка загрузки продукта');
      }
    }
    fetchProducts();
}, []);

  const getProducts = async (categoryId: number | null = null) => {
    if(categoryId){
      try{
        const res: any = apiClient.get('/products/'+categoryId);
        setProducts(res.data);
      } catch(err){
        setError('Ошибка загрузки категорий');
        setLoading(false); 
      }
    }
    else{
      try{
        const res: any = apiClient.get('/products/');
        setProducts(res.data);
      } catch(err){
        setError('Ошибка загрузки категорий');
        setLoading(false); 
      }

    }
  }

  const createProduct = async (productData: FormData  | Omit<Product, 'id' | 'created_at' | 'product_count'>) => {
    try{
      let response = await apiClient.post(`/products/create`, productData);
      const newProduct: Product = response.data;
      setProducts([...products, newProduct]);
      
    } catch(err){
      console.log('err', err);
      setError('Ошибка загрузки категорий');
      setLoading(false); 
    }
  }

  const updateProduct = async (id: string, productData: FormData  | Omit<Product, 'id' | 'created_at' | 'product_count'>) => {
    try{
      let response = await apiClient.post(`/products/update/${id}`, productData);
      const newProduct: Product = response.data;
      setProducts(prev => [...prev, newProduct]);
      const updatedProduct = response.data;
      setProducts(prev => prev.map(product => 
        product.id == id ? updatedProduct : product
      ));
      return updatedProduct;
    } catch(err){
      console.log('err', err);
      setError('Ошибка создания продукта');
      setLoading(false); 
    }
  }

  const deleteProduct = async (id: string) => {
    try{
      await apiClient.post(`/products/delete/${id}`);
      setProducts(prev => prev.filter(product => 
        product.id !== id));
    } catch(err){
      console.log('err', err);
      setError('Ошибка удаление продукта');
      setLoading(false); 
    }
  }

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct
  }

}