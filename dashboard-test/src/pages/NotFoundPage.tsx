// import React from "react";

import { FaHome, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600">
            La página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            to="/"
          >
            <FaHome className="w-4 h-4 mr-2" />
            Ir al Inicio
          </Link>

          <Link
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            to="/dashboard/alerts"
          >
            <FaSearch className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
