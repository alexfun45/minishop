import {procuctService} from '../models/product.ts'

interface IProduct{
  id: number;
  name_ru: string;
  price: number;
}

class productController{

  public static async getProducts(): Promise<IProduct[]>{
    return await procuctService.getProducts();
  }

}

export default productController;