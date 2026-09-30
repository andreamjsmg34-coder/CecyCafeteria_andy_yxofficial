"use strict";

const productos = [
  { id: "hamburguesa", nombre: "Hamburguesa", precio: 35 },
  { id: "torta", nombre: "Torta", precio: 30 },
  { id: "sandwich", nombre: "Sándwich", precio: 25 },
  { id: "pizza", nombre: "Pizza", precio: 30 },
  { id: "agua", nombre: "Agua", precio: 15 },
  { id: "refresco", nombre: "Refresco", precio: 10 }
];

let carrito = [];
let historialPedidos = [];
let pedidoActual = null;
let siguienteNumeroPedido = 1;
let temporizadorEntrega = null;
let temporizadorAviso = null;

document.addEventListener("DOMContentLoaded", iniciarAplicacion);

function iniciarAplicacion() {
  const formulario = document.getElementById("formLogin");
  formulario.addEventListener("submit", iniciarSesion);

  document.body.addEventListener("click", function (evento) {
    const boton = evento.target.closest("button");
    if (!boton) return;

    if (boton.dataset.screen) {
      if (boton.dataset.orders) {
        mostrarPedidos(boton.dataset.orders);
      } else {
        mostrarPantalla(boton.dataset.screen);
      }
      return;
    }

    if (boton.dataset.product) {
      agregarProducto(boton.dataset.product);
      return;
    }

    if (boton.dataset.action === "logout") cerrarSesion();
    if (boton.dataset.action === "confirm") confirmarPedido();
    if (boton.dataset.action === "ticket") mostrarTicket();
    if (boton.dataset.action === "finish") finalizarPedido();

    if (boton.dataset.quantity) {
      cambiarCantidad(Number(boton.dataset.index), Number(boton.dataset.quantity));
    }
    if (boton.dataset.remove !== undefined) {
      eliminarProducto(Number(boton.dataset.remove));
    }
  });

  actualizarPedido();
}

function iniciarSesion(evento) {
  evento.preventDefault();
  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;
  if (!correo || !contrasena) {
    mostrarAviso("Escribe tu correo y contraseña para continuar.");
    return;
  }

  mostrarPantalla("pantallaInicio");
  mostrarAviso("¡Bienvenido a CecyCafetería!");
}

function mostrarPantalla(idPantalla) {
  const seleccionada = document.getElementById(idPantalla);
  if (!seleccionada) {
    console.error("No existe la pantalla solicitada:", idPantalla);
    return;
  }

  document.querySelectorAll(".pantalla").forEach(function (pantalla) {
    pantalla.classList.toggle("activa", pantalla === seleccionada);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function agregarProducto(idProducto) {
  const producto = productos.find(function (elemento) {
    return elemento.id === idProducto;
  });
  if (!producto) {
    console.error("No existe el producto solicitado:", idProducto);
    return;
  }

  const existente = carrito.find(function (elemento) {
    return elemento.id === producto.id;
  });
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  actualizarPedido();
  mostrarAviso(producto.nombre + " agregado a tu pedido.");
}

function cambiarCantidad(indice, cambio) {
  const producto = carrito[indice];
  if (!producto || (cambio !== 1 && cambio !== -1)) return;
  producto.cantidad += cambio;
  if (producto.cantidad <= 0) carrito.splice(indice, 1);
  actualizarPedido();
}

function eliminarProducto(indice) {
  if (!Number.isInteger(indice) || indice < 0 || indice >= carrito.length) return;
  const eliminado = carrito.splice(indice, 1)[0];
  actualizarPedido();
  mostrarAviso(eliminado.nombre + " eliminado del pedido.");
}

function calcularTotal(elementos) {
  return elementos.reduce(function (total, producto) {
    return total + producto.precio * producto.cantidad;
  }, 0);
}

function formatoMoneda(cantidad) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(cantidad);
}

function actualizarPedido() {
  const lista = document.getElementById("listaPedido");
  lista.replaceChildren();

  if (carrito.length === 0) {
    const vacio = document.createElement("div");
    vacio.className = "vacio";
    vacio.innerHTML = '<div><span class="vacio-icono" aria-hidden="true">🛍️</span><strong>Tu pedido está vacío</strong><p>Ve al menú y agrega algo rico.</p></div>';
    lista.appendChild(vacio);
  } else {
    carrito.forEach(function (producto, indice) {
      const fila = document.createElement("div");
      fila.className = "fila-pedido";

      const detalle = document.createElement("div");
      const nombre = document.createElement("div");
      nombre.className = "fila-nombre";
      nombre.textContent = producto.nombre;
      const precio = document.createElement("div");
      precio.className = "fila-precio";
      precio.textContent = formatoMoneda(producto.precio) + " c/u";
      detalle.append(nombre, precio);

      const cantidad = document.createElement("div");
      cantidad.className = "cantidad";
      cantidad.setAttribute("aria-label", "Cantidad de " + producto.nombre);
      cantidad.append(
        crearBotonCantidad("−", indice, -1, "Disminuir cantidad"),
        crearTextoCantidad(producto.cantidad),
        crearBotonCantidad("+", indice, 1, "Aumentar cantidad")
      );

      const subtotal = document.createElement("strong");
      subtotal.className = "fila-subtotal";
      subtotal.textContent = formatoMoneda(producto.precio * producto.cantidad);
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "quitar";
      quitar.dataset.remove = String(indice);
      quitar.setAttribute("aria-label", "Eliminar " + producto.nombre);
      quitar.textContent = "✕";
      fila.append(detalle, cantidad, subtotal, quitar);
      lista.appendChild(fila);
    });
  }

  document.getElementById("total").textContent = formatoMoneda(calcularTotal(carrito));
  const cantidadTotal = carrito.reduce(function (total, producto) {
    return total + producto.cantidad;
  }, 0);
  ["contadorInicio", "contadorMenu", "contadorPedido", "contadorPie"].forEach(function (id) {
    document.getElementById(id).textContent = String(cantidadTotal);
  });
  document.getElementById("botonConfirmar").disabled = carrito.length === 0;
}

function crearBotonCantidad(texto, indice, cambio, etiqueta) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.dataset.index = String(indice);
  boton.dataset.quantity = String(cambio);
  boton.setAttribute("aria-label", etiqueta);
  boton.textContent = texto;
  return boton;
}

function crearTextoCantidad(cantidad) {
  const texto = document.createElement("span");
  texto.textContent = String(cantidad);
  return texto;
}

function confirmarPedido() {
  if (carrito.length === 0) {
    mostrarAviso("Agrega al menos un producto antes de confirmar.");
    return;
  }
  if (temporizadorEntrega) window.clearTimeout(temporizadorEntrega);

  const ahora = new Date();
  pedidoActual = {
    numero: siguienteNumeroPedido++,
    productos: carrito.map(function (producto) {
      return { ...producto };
    }),
    total: calcularTotal(carrito),
    fecha: ahora.toLocaleDateString("es-MX"),
    hora: ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
    estado: "Preparando",
    pagado: true
  };
  historialPedidos.unshift(pedidoActual);
  prepararPantallaPedido(pedidoActual);
  mostrarPantalla("pantallaConfirmacion");

  const barra = document.querySelector(".barra-progreso");
  const progreso = document.getElementById("progresoPedido");
  progreso.style.transition = "none";
  progreso.style.width = "0";
  barra.setAttribute("aria-valuenow", "0");
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      progreso.style.transition = "width 4.5s linear";
      progreso.style.width = "100%";
      barra.setAttribute("aria-valuenow", "100");
    });
  });

  temporizadorEntrega = window.setTimeout(function () {
    if (!pedidoActual) return;
    pedidoActual.estado = "Entregado";
    document.getElementById("tituloPreparando").textContent = "Pedido entregado";
    document.getElementById("textoEstado").textContent = "¡Listo! Tu pedido está preparado para disfrutar.";
    document.getElementById("iconoPedido").textContent = "✅";
    const botonTicket = document.getElementById("botonContinuarTicket");
    botonTicket.disabled = false;
    botonTicket.textContent = "Continuar al ticket →";
    renderizarOrdenes();
    mostrarAviso("¡Tu pedido está listo!");
  }, 4600);
}

function prepararPantallaPedido(pedido) {
  document.getElementById("numeroPedido").textContent = String(pedido.numero).padStart(3, "0");
  document.getElementById("totalFinal").textContent = formatoMoneda(pedido.total);
  document.getElementById("tituloPreparando").textContent = "Preparando pedido";
  document.getElementById("textoEstado").textContent = "Estamos preparando tus productos. ¡En un momento estarán listos!";
  document.getElementById("iconoPedido").textContent = "👩‍🍳";
  const resumen = document.getElementById("resumenPedidoFinal");
  resumen.textContent = pedido.productos.map(function (producto) {
    return producto.nombre + " × " + producto.cantidad;
  }).join(" · ");
  const botonTicket = document.getElementById("botonContinuarTicket");
  botonTicket.disabled = true;
  botonTicket.textContent = "Preparando…";
}

function mostrarTicket() {
  if (!pedidoActual || pedidoActual.estado !== "Entregado") {
    mostrarAviso("Tu pedido todavía se está preparando.");
    return;
  }
  document.getElementById("numeroTicket").textContent = "#" + String(pedidoActual.numero).padStart(3, "0");
  document.getElementById("fechaTicket").textContent = pedidoActual.fecha;
  document.getElementById("horaTicket").textContent = pedidoActual.hora;
  document.getElementById("totalTicket").textContent = formatoMoneda(pedidoActual.total);
  document.getElementById("pagoTicket").textContent = pedidoActual.pagado ? "PAGADO" : "PENDIENTE";

  const lista = document.getElementById("productosTicket");
  lista.replaceChildren();
  pedidoActual.productos.forEach(function (producto) {
    const fila = document.createElement("div");
    fila.className = "ticket-producto";
    const detalle = document.createElement("span");
    detalle.textContent = producto.nombre + " × " + producto.cantidad;
    const subtotal = document.createElement("span");
    subtotal.textContent = formatoMoneda(producto.precio * producto.cantidad);
    fila.append(detalle, subtotal);
    lista.appendChild(fila);
  });
  mostrarPantalla("pantallaTicket");
}

function finalizarPedido() {
  carrito = [];
  pedidoActual = null;
  actualizarPedido();
  mostrarPantalla("pantallaInicio");
  mostrarAviso("¡Gracias por comprar en CecyCafetería!");
}

function mostrarPedidos(tipo) {
  renderizarOrdenes();
  mostrarPantalla(tipo === "all" ? "pantallaHistorial" : "pantallaPedidos");
}

function renderizarOrdenes() {
  [["listaPedidos", historialPedidos.slice(0, 5)], ["listaHistorial", historialPedidos]].forEach(function (grupo) {
    const lista = document.getElementById(grupo[0]);
    lista.replaceChildren();
    if (grupo[1].length === 0) {
      const vacio = document.createElement("div");
      vacio.className = "vacio";
      vacio.textContent = "Aún no tienes pedidos. Cuando hagas uno, aparecerá aquí.";
      lista.appendChild(vacio);
      return;
    }
    grupo[1].forEach(function (pedido) {
      lista.appendChild(crearTarjetaPedido(pedido));
    });
  });
}

function crearTarjetaPedido(pedido) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "orden-card";
  const cabecera = document.createElement("div");
  cabecera.className = "orden-cabecera";
  const titulo = document.createElement("h2");
  titulo.textContent = "Pedido #" + String(pedido.numero).padStart(3, "0");
  const estado = document.createElement("span");
  estado.className = "estado-etiqueta";
  estado.textContent = pedido.estado;
  cabecera.append(titulo, estado);

  const fecha = document.createElement("p");
  fecha.className = "orden-fecha";
  fecha.textContent = pedido.fecha + " · " + pedido.hora;
  tarjeta.append(cabecera, fecha);
  pedido.productos.forEach(function (producto) {
    const linea = document.createElement("div");
    linea.className = "orden-linea";
    const nombre = document.createElement("span");
    nombre.textContent = producto.nombre + " × " + producto.cantidad;
    const subtotal = document.createElement("span");
    subtotal.textContent = formatoMoneda(producto.precio * producto.cantidad);
    linea.append(nombre, subtotal);
    tarjeta.appendChild(linea);
  });

  const total = document.createElement("div");
  total.className = "orden-total";
  const etiquetaTotal = document.createElement("span");
  etiquetaTotal.textContent = "Total";
  const monto = document.createElement("span");
  monto.textContent = formatoMoneda(pedido.total);
  total.append(etiquetaTotal, monto);
  tarjeta.appendChild(total);
  return tarjeta;
}

function cerrarSesion() {
  document.getElementById("formLogin").reset();
  carrito = [];
  actualizarPedido();
  mostrarPantalla("pantallaLogin");
}

function mostrarAviso(mensaje) {
  const aviso = document.getElementById("aviso");
  aviso.textContent = mensaje;
  aviso.classList.add("visible");
  if (temporizadorAviso) window.clearTimeout(temporizadorAviso);
  temporizadorAviso = window.setTimeout(function () {
    aviso.classList.remove("visible");
  }, 2600);
}
