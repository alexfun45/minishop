import { Router } from 'express'
import {categoryController} from '../controllers/categoryController.ts'
import { uploadCategory } from '../middleware/uploadCategory.ts';

const categoryRouter = Router();

categoryRouter.get('/categories', categoryController.getCategories);
categoryRouter.post('/categories/delete/:id', categoryController.delete);
categoryRouter.post('/categories/create',  uploadCategory.single('image'), categoryController.create);
categoryRouter.post('/categories/update/:id', uploadCategory.single('image'), categoryController.update);

export default categoryRouter;