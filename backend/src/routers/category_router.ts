import { Router } from 'express'
import {categoryController} from '../controllers/categoryController.js'
import { uploadCategory } from '../middleware/uploadCategory.js';

const categoryRouter = Router();

categoryRouter.get('/categories', categoryController.getCategories);
categoryRouter.post('/categories/delete/:id', categoryController.delete);
categoryRouter.post('/categories/create',  uploadCategory.single('image'), categoryController.create);
categoryRouter.post('/categories/update/:id', uploadCategory.single('image'), categoryController.update);

export default categoryRouter;