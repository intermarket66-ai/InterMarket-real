import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Table } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from '../components/NotificacionOperacion';
import ModalEdicionVenta from '../components/ventas/ModalEdicionVenta';
import ModalEliminacionVenta from '../components/ventas/ModalEliminacionVenta';

const Vendedor = () => {
  // Variables de estado
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [ventaAEliminar, setVentaAEliminar] = useState(null);
  const [ventaEditar, setVentaEditar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: '' });

  // Cargar ventas desde Supabase
  const cargarVentas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("ventas")
        .select(`
          *,
          productos (
            nombre_producto
          )
        `)
        .order("fecha_venta", { ascending: false });

      if (error) {
        console.error("Error al cargar ventas:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al cargar ventas.",
          tipo: "error",
        });
        return;
      }
      setVentas(data || []);
    } catch (err) {
      console.error("Excepción al cargar ventas:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al cargar ventas.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  // Cargar productos para referencia
  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("productos")
        .select("id, nombre_producto")
        .order("nombre_producto", { ascending: true });

      if (error) {
        console.error("Error al cargar productos:", error.message);
        return;
      }
      setProductos(data || []);
    } catch (err) {
      console.error("Excepción al cargar productos:", err.message);
    }
  };

  // Editar venta
  const editarVenta = async () => {
    try {
      if (
        !ventaEditar.pedido_id.trim() ||
        !ventaEditar.comprador_id.trim() ||
        !ventaEditar.producto_id ||
        !ventaEditar.monto_total ||
        !ventaEditar.comision ||
        !ventaEditar.monto_neto ||
        !ventaEditar.fecha_venta
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos obligatorios.",
          tipo: "advertencia",
        });
        return;
      }

      const ventaData = {
        pedido_id: ventaEditar.pedido_id,
        comprador_id: ventaEditar.comprador_id,
        producto_id: parseInt(ventaEditar.producto_id),
        monto_total: parseFloat(ventaEditar.monto_total),
        comision: parseFloat(ventaEditar.comision),
        monto_neto: parseFloat(ventaEditar.monto_neto),
        estado: ventaEditar.estado,
        metodo_pago: ventaEditar.metodo_pago,
        numero_transaccion: ventaEditar.numero_transaccion || null,
        fecha_venta: ventaEditar.fecha_venta,
        fecha_entrega: ventaEditar.fecha_entrega || null,
        comentarios: ventaEditar.comentarios || null
      };

      const { error } = await supabase
        .from("ventas")
        .update(ventaData)
        .eq("pedido_id", ventaEditar.pedido_id);

      if (error) {
        console.error("Error al editar venta:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al actualizar venta.",
          tipo: "error",
        });
        return;
      }

      // Éxito
      setToast({
        mostrar: true,
        mensaje: `Venta "${ventaEditar.pedido_id}" actualizada exitosamente.`,
        tipo: "exito",
      });

      setMostrarModalEdicion(false);
      setVentaEditar(null);
      cargarVentas();

    } catch (err) {
      console.error("Excepción al editar venta:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al actualizar venta.",
        tipo: "error",
      });
    }
  };

  // Eliminar venta
  const eliminarVenta = async () => {
    try {
      const { error } = await supabase
        .from("ventas")
        .delete()
        .eq("pedido_id", ventaAEliminar.pedido_id);

      if (error) {
        console.error("Error al eliminar venta:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al eliminar venta.",
          tipo: "error",
        });
        return;
      }

      // Éxito
      setToast({
        mostrar: true,
        mensaje: `Venta "${ventaAEliminar.pedido_id}" eliminada exitosamente.`,
        tipo: "exito",
      });

      setMostrarModalEliminacion(false);
      setVentaAEliminar(null);
      cargarVentas();

    } catch (err) {
      console.error("Excepción al eliminar venta:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al eliminar venta.",
        tipo: "error",
      });
    }
  };

  // Métodos para control de apertura de modales
  const abrirModalEdicion = (venta) => {
    setVentaEditar({
      pedido_id: venta.pedido_id,
      comprador_id: venta.comprador_id,
      producto_id: venta.producto_id,
      monto_total: venta.monto_total,
      comision: venta.comision,
      monto_neto: venta.monto_neto,
      estado: venta.estado,
      metodo_pago: venta.metodo_pago,
      numero_transaccion: venta.numero_transaccion || '',
      fecha_venta: venta.fecha_venta,
      fecha_entrega: venta.fecha_entrega || '',
      comentarios: venta.comentarios || ''
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (venta) => {
    setVentaAEliminar(venta);
    setMostrarModalEliminacion(true);
  };

  // Manejo de cambios en inputs
  const manejoCambioEdicion = (e) => {
    const { name, value } = e.target;
    setVentaEditar(prev => ({ ...prev, [name]: value }));
  };

  // Cargar datos al iniciar
  useEffect(() => {
    cargarVentas();
    cargarProductos();
  }, []);

  return (
    <Container>
      <br />
      <Row>
        <Col>
          <h1>Ventas del Vendedor</h1>
        </Col>
      </Row>
      <br />

      {cargando ? (
        <div className="text-center">
          <Spinner animation="border" />
          <p>Cargando ventas...</p>
        </div>
      ) : (
        <Row>
          <Col>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  
                  <th>Producto</th>
                  <th>Comprador</th>
                  <th>Monto Total</th>
                  <th>Comisión</th>
                  <th>Monto Neto</th>
                  <th>Estado</th>
                  <th>Método de Pago</th>
                  <th>Número Transacción</th>
                  <th>Fecha Venta</th>
                  <th>Fecha Entrega</th>
                  <th>Comentarios</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.pedido_id}>
                   
                    <td>{venta.productos?.nombre_producto}</td>
                    <td>{venta.comprador_id}</td>
                    <td>{venta.monto_total}</td>
                    <td>{venta.comision}</td>
                    <td>{venta.monto_neto}</td>
                    <td>{venta.estado}</td>
                    <td>{venta.metodo_pago}</td>
                    <td>{venta.numero_transaccion}</td>
                    <td>{venta.fecha_venta}</td>
                    <td>{venta.fecha_entrega}</td>
                    <td>{venta.comentarios}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => abrirModalEdicion(venta)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => abrirModalEliminacion(venta)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>
      )}

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onClose={() => setToast({ mostrar: false, mensaje: '', tipo: '' })}
      />

      {/* Modales */}
      <ModalEdicionVenta
        mostrarModal={mostrarModalEdicion}
        setMostrarModal={setMostrarModalEdicion}
        ventaEditar={ventaEditar}
        manejoCambioEdicion={manejoCambioEdicion}
        editarVenta={editarVenta}
        productos={productos}
      />

      <ModalEliminacionVenta
        mostrarModal={mostrarModalEliminacion}
        setMostrarModal={setMostrarModalEliminacion}
        ventaAEliminar={ventaAEliminar}
        eliminarVenta={eliminarVenta}
      />
    </Container>
  );
};

export default Vendedor;