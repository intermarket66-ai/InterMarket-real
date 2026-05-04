import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Form, InputGroup, Button } from 'react-bootstrap';
import { supabase } from '../database/supabaseconfig';
import TarjetaCatalogomovile from '../components/catalogo/tarjetaCatalogomovile';
import CarritoModal from '../components/catalogo/CarritoModal';
import ModalMensaje from '../components/catalogo/ModalMensaje';
import ModalDetalleProducto from '../components/catalogo/ModalDetalleProducto';
import ModalPostCompra from '../components/catalogo/ModalPostCompra';
import { useAuth } from '../context/AuthContext';

function Catalogo() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [mostrarSoloOfertas, setMostrarSoloOfertas] = useState(false);
    const [mostrarModalMensaje, setMostrarModalMensaje] = useState(false);
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
    const [mostrarModalPostCompra, setMostrarModalPostCompra] = useState(false);
    const [itemsCompradosRecientemente, setItemsCompradosRecientemente] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [miTiendaId, setMiTiendaId] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            if (user) {
                const { data } = await supabase
                    .from('tiendas')
                    .select('id_tienda')
                    .eq('id_usuario', user.id)
                    .single();
                if (data) setMiTiendaId(data.id_tienda);
            }
        };
        checkUser();
        cargarProductos();

        const carritoGuardado = localStorage.getItem('carrito');
        if (carritoGuardado) setCarrito(JSON.parse(carritoGuardado));
    }, [user]);

    const cargarProductos = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from('productos')
                .select('*, perfiles(nombre_completo), categorias(nombre_categoria)')
                .order('creado_en', { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error('Error al cargar productos:', error.message);
        } finally {
            setCargando(false);
        }
    };

    const abrirModalDetalles = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalDetalle(true);
    };

    const abrirModalContacto = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalMensaje(true);
    };

    const handleCompraExitosa = (items) => {
        setItemsCompradosRecientemente(items);
        setMostrarModalPostCompra(true);
        setCarrito([]);
        localStorage.removeItem('carrito');
        cargarProductos();
    };

    const agregarAlCarrito = (producto) => {
        const itemExistente = carrito.find(item => item.id_producto === producto.id_producto);
        let nuevoCarrito;

        if (itemExistente) {
            nuevoCarrito = carrito.map(item =>
                item.id_producto === producto.id_producto
                    ? { ...item, cantidad: (item.cantidad || 1) + 1 }
                    : item
            );
        } else {
            nuevoCarrito = [...carrito, { ...producto, cantidad: 1 }];
        }
        setCarrito(nuevoCarrito);
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    };

    const totalCarrito = carrito.reduce((total, item) => {
        return total + (parseFloat(item.precio_venta || 0) * (item.cantidad || 1));
    }, 0);

    return (
        <Container className="pb-5 margen-superior-main">
            <div className="pt-3">
                <Row className="mb-4 align-items-center">
                    <Col xs={12}>
                        <InputGroup className="shadow-sm border-0 rounded-pill overflow-hidden bg-white mb-3">
                            <InputGroup.Text className="bg-white border-0 ps-4">
                                <i className="bi bi-search text-muted"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Buscar en InterMarket..."
                                className="border-0 py-2"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                </Row>

                {cargando ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="dark" />
                    </div>
                ) : (
                    <Row className="g-3">
                        {productos
                            .filter(p => p.nombre_producto?.toLowerCase().includes(busqueda.toLowerCase()) || p.categorias?.nombre_categoria?.toLowerCase().includes(busqueda.toLowerCase()))
                            .filter(p => !mostrarSoloOfertas || (p.precio_original && p.precio_original > p.precio_venta))
                            .map((producto) => (
                            <Col key={producto.id_producto} xs={6} md={4} lg={3}>
                                <TarjetaCatalogomovile 
                                    producto={producto}
                                    abrirModalDetalles={abrirModalDetalles}
                                    miTiendaId={miTiendaId}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </div>

            {/* Modales */}
            <CarritoModal mostrar={mostrarCarrito} setMostrar={setMostrarCarrito} carrito={carrito} setCarrito={setCarrito} total={totalCarrito} onCompraExitosa={handleCompraExitosa} />
            <ModalMensaje mostrar={mostrarModalMensaje} setMostrar={setMostrarModalMensaje} producto={productoSeleccionado} />
            <ModalDetalleProducto mostrar={mostrarModalDetalle} setMostrar={setMostrarModalDetalle} producto={productoSeleccionado} agregarAlCarrito={agregarAlCarrito} />
            <ModalPostCompra mostrar={mostrarModalPostCompra} setMostrar={setMostrarModalPostCompra} items={itemsCompradosRecientemente} alCalificar={abrirModalDetalles} />
        </Container>
    );
}

export default Catalogo;