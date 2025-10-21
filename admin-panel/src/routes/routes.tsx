import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import {ProductsList} from '../pages/Products/index';
import {EditProduct} from '../pages/Products/[id]';
import {NewProduct} from '../pages/Products/new';

import {CategoriesManagement} from '../pages/Categories/index';
import {NewCategory} from '../pages/Categories/new';

import {OrderDetails} from '../pages/Orders/[id]';
import {OrdersManagement} from '../pages/Orders/index';

import {AuthProvider} from "../contexts/AuthContext";
import PrivateRoute from "./protectedRoutes";

const MainRoutes = () => {
  return (
    <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products/" element={<ProductsList />} />
              <Route path="/products/new" element={<NewProduct />} />
              <Route path="/products/:id" element={<NewProduct />} />
              <Route path="/categories/" element={<CategoriesManagement/>} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
  )
}

export default MainRoutes