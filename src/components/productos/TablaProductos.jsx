import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaProductos = ({
    productos = [],
    abrirModalEdicion,
    abrirModalEliminacion
}) => {
    return (
        <Table striped bordered hover responsive size="sm">
            <thead className="table-dark">
                <tr>
                    <th>ID</th>
                    <th>Nombre del Producto</th>
                    <th className="d-none d-lg-table-cell">Descripción</th>
                    <th>Categoría</th>
                    <th className="text-end">Precio Compra</th>
                    <th className="text-end">Precio Venta</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {productos.map((producto) => (
                    <tr key={producto.id_producto}>
                        <td>{producto.id_producto}</td>
                        
                        <td className="fw-bold">
                            {producto.nombre_producto}
                        </td>
                        
                        <td className="d-none d-lg-table-cell text-truncate" style={{ maxWidth: '250px' }}>
                            {producto.descripcion || 'Sin descripción'}
                        </td>
                        
                        <td>
                            {producto.categorias?.nombre_categoria || 'Sin categoría'}
                        </td>
                        
                        <td className="text-end">
                            ${parseFloat(producto.precio_compra || 0).toFixed(2)}
                        </td>
                        
                        <td className="text-end fw-bold text-success">
                            ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                        </td>
                        
                        <td className="text-center">
                            <Badge 
                                bg={producto.id_estado === 1 ? 'success' : 'warning'}
                                className="px-3 py-1"
                            >
                                {producto.id_estado === 1 ? 'Entregado' : 'Proceso'}
                            </Badge>
                        </td>
                        
                        <td className="text-center">
                            <Button
                                variant="outline-warning"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEdicion(producto)}
                                title="Editar producto"
                            >
                                <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEliminacion(producto)}
                                title="Eliminar producto"
                            >
                                <i className="bi bi-trash"></i>
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default TablaProductos;