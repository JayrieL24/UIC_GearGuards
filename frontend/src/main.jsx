import React from 'react'
import ReactDOM from 'react-dom/client'


import App from './App.jsx'
import Return from './Pages/Return/Return.jsx'
import Borrow from './Pages/Borrow/Borrow.tsx'
import Account from './Pages/Account/Account.jsx'
import Scan from './Pages/Scan/Scan.jsx'
import Login from './Pages/Auth/Login.jsx'
import Register from './Pages/Auth/Register.jsx'
import Approvals from './Pages/Admin/Approvals.jsx'
import { AdminDashboard } from './Pages/Admin/Dashboard.jsx'
import { AdminInventory } from './Pages/Admin/Inventory.jsx'
import { AdminBorrows } from './Pages/Admin/Borrows.jsx'
import { AdminReports } from './Pages/Admin/Reports.jsx'

import {createBrowserRouter,RouterProvider} from "react-router-dom";

import './CSS/Scan.css'
import './CSS/Return.css'
import './CSS/Account.css'
import './CSS/Borrow.css'
import './CSS/Theme.css'
import './CSS/AdminDashboard.css'
import './CSS/AdminInventory.css'
import './CSS/AdminBorrows.css'
import './CSS/AdminApprovals.css'
import './CSS/AdminReports.css'
import './index.css'
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <App />,
  },
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/inventory",
    element: <AdminInventory />,
  },
  {
    path: "/admin/borrows",
    element: <AdminBorrows />,
  },
  {
    path: "/admin/reports",
    element: <AdminReports />,
  },
  {
    path: "/Return",
    element: <Return />,
  },
  {
    path: "/Borrow",
    element: <Borrow />,
  },
  {
    path: "/Account",
    element: <Account />
  },
  {
    path: "/Scan",
    element: <Scan />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/admin/approvals",
    element: <Approvals />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   <RouterProvider router={router} />
  </React.StrictMode>,
)
