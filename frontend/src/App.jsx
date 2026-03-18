import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';
const API_BASE = import.meta.env.VITE_API_URL;

function App() {
  const [catalogo, setCatalogo] = useState([]);
  const [misCitas, setMisCitas] = useState([]);
  const [todasLasCitas, setTodasLasCitas] = useState([]); 
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [detallesCalculadora, setDetallesCalculadora] = useState([]);
  const [precioBase, setPrecioBase] = useState(0);
  const [recomendacionAdmin, setRecomendacionAdmin] = useState("");
  const [fechaHoraAdmin, setFechaHoraAdmin] = useState("");
  const [sistemaAdmin, setSistemaAdmin] = useState("");
  const [citaPidiendoCambio, setCitaPidiendoCambio] = useState(null);
  const [motivoCambio, setMotivoCambio] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [duracionAdmin, setDuracionAdmin] = useState(120);

  const [fechaElegida, setFechaElegida] = useState("");
  const [horaElegida, setHoraElegida] = useState("");
  
  const HORARIOS_FIJOS = ["09:00", "11:30", "14:00", "16:30"];

  const [vista, setVista] = useState('inicio');
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [modoAuth, setModoAuth] = useState('login');
  const [citaEnviada, setCitaEnviada] = useState(false);
  const [infoClienta, setInfoClienta] = useState(null);
  const [adminTab, setAdminTab] = useState('solicitudes'); 

  const CORREO_JEFA = "solangesilvamendoza7@gmail.com";
  // 👇 RECUERDA PONER TUS DATOS AQUÍ 👇
  const NUMERO_WHATSAPP = "51930473715"; 
  const NUMERO_YAPE = "930 472 715"; 
  const USUARIO_INSTAGRAM = "stellarnails.pe"; 

  const formatoFechaInput = (fechaBackend) => {
    if (!fechaBackend) return "";
    return fechaBackend.slice(0, 16); 
  };

  const mostrarFechaBonita = (fechaBackend) => {
    if (!fechaBackend) return "";
    const fechaLimpia = fechaBackend.slice(0, 16); 
    const d = new Date(fechaLimpia);
    return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const formatoDuracion = (minutos) => {
    if (!minutos) return "2h";
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const cargarTodasLasCitas = () => {
  axios.get(`${API_BASE}/citas/`).then(r => {
    const citasOrdenadas = r.data.sort((a, b) => b.id - a.id);
    setTodasLasCitas(citasOrdenadas);
  }).catch(console.error);
};

  const cargarCatalogo = () => axios.get('https://u-itas.onrender.com/api/catalogo/').then(r => setCatalogo(r.data)).catch(console.error);
  const cargarInsumos = () => axios.get('https://u-itas.onrender.com/api/insumos/').then(r => setInsumosDisponibles(r.data)).catch(console.error);

  useEffect(() => { 
    cargarCatalogo(); 
    cargarInsumos(); 
    cargarTodasLasCitas(); 
  }, []);

  const cargarMisCitas = () => {
    axios.get('https://u-itas.onrender.com/api/citas/').then(response => {
        const citasCliente = response.data.filter(cita => cita.cliente === usuarioActual?.id);
        setMisCitas(citasCliente.sort((a, b) => b.id - a.id));
        setVista('mis-citas');
    }).catch(console.error);
  };

  const manejarAuth = async (e) => {
    e.preventDefault();
    const endpoint = modoAuth === 'login' ? 'login' : 'registro';
    
    // 👇 ESTO ES LO NUEVO: Te mostrará un mensajito mientras carga
    const toastId = toast.loading('Conectando con Stellar, esto puede tardar un minuto...');

    try {
      const respuesta = await axios.post(`${API_BASE}/${endpoint}/`, { 
        username: e.target.email.value, 
        email: e.target.email.value, 
        password: e.target.password.value 
      });
      
      // 👇 Si funciona, quita el mensaje de carga
      toast.dismiss(toastId); 
      
      setUsuarioActual(respuesta.data);
      cargarTodasLasCitas(); 
      if (respuesta.data.email === CORREO_JEFA) {
        toast.success(`¡Bienvenida a tu panel de control!`, { icon: '👑', style: { borderRadius: '10px', background: '#F7F2E6', color: '#6F5F53' } });
        setVista('admin-panel');
        setAdminTab('dashboard'); 
      } else {
        toast.success(`¡Bienvenida a Stellar!`, { style: { borderRadius: '10px', background: '#F7F2E6', color: '#6F5F53' } });
        setVista('agendar');
      }
    } catch (error) {
      // 👇 Si falla, quita el mensaje de carga y te avisa el error
      toast.dismiss(toastId); 
      const mensajeError = error.response?.data?.error || 'Error de conexión. Presiona F12 y revisa la consola.';
      toast.error(mensajeError, { duration: 5000 });
    }
  };

  const verificarChoqueDeHora = (fechaStr, duracionMin = 120, idExcluido = null) => {
    const fechaSegura1 = fechaStr.length === 16 ? `${fechaStr}:00` : fechaStr;
    const inicio1 = new Date(fechaSegura1);
    if (isNaN(inicio1.getTime())) return false; 

    const fin1 = new Date(inicio1.getTime() + duracionMin * 60000);

    return todasLasCitas.some(c => {
      if (c.id === idExcluido) return false; 
      if (c.estado === 'cancelada') return false; 
      if (!c.fecha_hora) return false;

      const fechaSegura2 = c.fecha_hora.slice(0, 16) + ":00";
      const inicio2 = new Date(fechaSegura2);
      if (isNaN(inicio2.getTime())) return false;

      const duracion2 = c.duracion_estimada || 120;
      const fin2 = new Date(inicio2.getTime() + duracion2 * 60000);

      return (inicio1 < fin2 && inicio2 < fin1);
    });
  };

  const horasDisponiblesHoy = fechaElegida 
    ? HORARIOS_FIJOS.filter(hora => !verificarChoqueDeHora(`${fechaElegida}T${hora}`))
    : [];

  const manejarEnvioCita = async (e) => {
    e.preventDefault();
    if (!horaElegida) {
      toast.error('Por favor, selecciona una hora disponible de los botones.');
      return;
    }

    const form = e.target;
    const formData = new FormData();
    formData.append('fecha_hora', `${fechaElegida}T${horaElegida}`);
    formData.append('foto_diseno', form.querySelector('#fotoDiseno').files[0]);
    formData.append('foto_perfil_una', form.querySelector('#fotoPerfil').files[0]);
    formData.append('notas_cliente', form.querySelector('#notas').value);
    formData.append('sistema_unas', form.querySelector('#sistemaUnas').value);
    formData.append('edad', form.querySelector('#edadCliente').value);
    formData.append('cliente', usuarioActual.id); 
    formData.append('precio_base', 0);

    const toastId = toast.loading('Enviando tu solicitud...');
    try {
      await axios.post('https://u-itas.onrender.com/api/citas/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.dismiss(toastId);
      toast.success('¡Cita agendada con éxito!');
      setFechaElegida("");
      setHoraElegida("");
      setCitaEnviada(true);
      cargarTodasLasCitas(); 
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`Error: ${error.message}`);
    }
  };

  const cancelarCitaClienta = async (citaId) => {
    const mensaje = "🚨 ¿Estás segura de que deseas cancelar tu cita?\n\n⚠️ IMPORTANTE: Según nuestras políticas, los abonos realizados NO son reembolsables.\n\nEsta acción no se puede deshacer. ¿Deseas continuar?";
    if(!window.confirm(mensaje)) return;
    
    const toastId = toast.loading('Cancelando cita...');
    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaId}/cancelar/`, { cancelado_por: 'cliente' });
      toast.dismiss(toastId);
      toast.success('Cita cancelada correctamente.');
      cargarMisCitas(); 
      cargarTodasLasCitas(); 
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Hubo un error al cancelar.');
    }
  };

  const cancelarCitaAdmin = async () => {
    if(!window.confirm("🚨 ¿Estás segura de cancelar esta cita? La clienta será notificada en su panel de que la cita fue cancelada.")) return;
    const toastId = toast.loading('Cancelando...');
    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaSeleccionada.id}/cancelar/`, { cancelado_por: 'admin' });
      toast.dismiss(toastId);
      toast.success('Cita cancelada.');
      setCitaSeleccionada(null); 
      cargarTodasLasCitas(); 
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Hubo un error al cancelar.');
    }
  };

  const restaurarCitaAdmin = async () => {
    if(!window.confirm("🔄 ¿Deseas deshacer la cancelación? La cita volverá exactamente al estado en el que estaba.")) return;
    const toastId = toast.loading('Restaurando...');
    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaSeleccionada.id}/restaurar/`);
      toast.dismiss(toastId);
      toast.success('¡Cita restaurada con éxito!');
      setCitaSeleccionada(null); 
      cargarTodasLasCitas(); 
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Hubo un error al restaurar.');
    }
  };

  const restaurarCitaDirecta = async (citaId) => {
    if(!window.confirm("🔄 ¿Deseas deshacer la cancelación? La cita volverá exactamente al estado en el que estaba.")) return;
    const toastId = toast.loading('Restaurando...');
    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaId}/restaurar/`);
      toast.dismiss(toastId);
      toast.success('¡Cita restaurada con éxito!');
      cargarTodasLasCitas(); 
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Hubo un error al restaurar.');
    }
  };

  const cerrarSesion = () => { setUsuarioActual(null); setVista('inicio'); setCitaSeleccionada(null); toast('Has cerrado sesión', { icon: '👋' }); };

  const abrirEvaluacion = async (cita) => {
    setCitaSeleccionada(cita);
    setRecomendacionAdmin(cita.recomendacion_admin || ""); 
    setFechaHoraAdmin(formatoFechaInput(cita.fecha_hora)); 
    setSistemaAdmin(cita.sistema_unas || ""); 
    setDuracionAdmin(cita.duracion_estimada || 120);
    
    if (cita.desglose_cotizacion && cita.desglose_cotizacion.length > 0) {
      setDetallesCalculadora(cita.desglose_cotizacion);
      setPrecioBase(parseFloat(cita.precio_base) || 0);
    } else {
      setDetallesCalculadora([]); 
      setPrecioBase(parseFloat(cita.costo_total) || parseFloat(cita.precio_base) || 0); 
    }
    setInfoClienta(null); 
    try {
      const res = await axios.get(`https://u-itas.onrender.com/api/clientes/${cita.cliente}/perfil/`);
      setInfoClienta(res.data);
    } catch (e) {
      setInfoClienta(null);
    }
  };

  const agregarInsumo = () => {
    const select = document.getElementById('selectInsumo');
    const inputCant = document.getElementById('inputCantidad');
    if (!select || !inputCant || !select.value) return;
    const insumoReal = insumosDisponibles.find(i => String(i.id) === String(select.value));
    
    if (insumoReal && parseInt(inputCant.value) > 0) {
      const indexExistente = detallesCalculadora.findIndex(item => String(item.id) === String(insumoReal.id));
      if (indexExistente >= 0) {
        const nuevosDetalles = [...detallesCalculadora];
        nuevosDetalles[indexExistente].cantidad += parseInt(inputCant.value);
        setDetallesCalculadora(nuevosDetalles);
      } else {
        setDetallesCalculadora([...detallesCalculadora, { id: insumoReal.id, nombre: insumoReal.nombre, precio: parseFloat(insumoReal.precio), cantidad: parseInt(inputCant.value) }]);
      }
      inputCant.value = 1;
      select.value = "";
      toast.success('✨ Extra agregado');
    }
  };

  const agregarInsumoPersonalizado = () => {
    const n = document.getElementById('inputNombrePersonalizado');
    const p = document.getElementById('inputPrecioPersonalizado');
    const c = document.getElementById('inputCantidadPersonalizado');
    if (!n || !p || !c) return;
    if (n.value.trim() !== '' && !isNaN(parseFloat(p.value)) && parseInt(c.value) > 0) {
      setDetallesCalculadora([...detallesCalculadora, { id: 'custom-' + Date.now(), nombre: n.value.trim(), precio: parseFloat(p.value), cantidad: parseInt(c.value) }]);
      n.value = ''; p.value = ''; c.value = 1;
      toast.success('✨ Extra agregado');
    }
  };

  const enviarCotizacion = async () => {
    if (verificarChoqueDeHora(fechaHoraAdmin, parseInt(duracionAdmin), citaSeleccionada.id)) {
      toast.error('⚠️ ¡Cuidado! Esta hora choca con otra cita de tu agenda.', { duration: 4000 });
      return; 
    }

    const toastId = toast.loading('Enviando cotización a la clienta...');
    const horaOriginal = formatoFechaInput(citaSeleccionada.fecha_hora);
    const seCambioHora = fechaHoraAdmin !== horaOriginal;

    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaSeleccionada.id}/cotizar/`, { 
        precio_base: precioBase, 
        detalles: detallesCalculadora, 
        recomendacion: recomendacionAdmin,
        fecha_hora: fechaHoraAdmin,
        sistema_unas: sistemaAdmin,
        hora_cambiada: seCambioHora,
        duracion_estimada: parseInt(duracionAdmin)
      });
      toast.dismiss(toastId);
      toast.success('¡Cotización enviada a la clienta!');
      setCitaSeleccionada(null); 
      cargarTodasLasCitas();     
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Hubo un error al guardar.');
    }
  };

  const aceptarPresupuesto = async (citaId) => {
    const toastId = toast.loading('Procesando...');
    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaId}/aceptar/`);
      toast.dismiss(toastId);
      toast.success('¡Genial! Sigue las instrucciones para tu abono.');
      cargarMisCitas(); 
    } catch (error) { toast.error('Error'); }
  };

  const enviarSolicitudCambio = async (citaId) => {
    if (!motivoCambio.trim()) {
      toast.error('Por favor escribe qué deseas cambiar.');
      return;
    }
    const toastId = toast.loading('Avisando a Stellar...');
    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaId}/solicitar_cambios/`, { motivo: motivoCambio });
      toast.dismiss(toastId);
      toast.success('¡Mensaje enviado! Revisaremos tu cita nuevamente.');
      setCitaPidiendoCambio(null); 
      setMotivoCambio(""); 
      cargarMisCitas(); 
    } catch (error) { 
      toast.dismiss(toastId);
      toast.error('Hubo un error al enviar el mensaje.'); 
    }
  };

  const ajustarExtraClienta = async (citaId, itemIndex, operacion) => {
    try { await axios.post(`https://u-itas.onrender.com/api/citas/${citaId}/ajustar_extra/`, { index: itemIndex, operacion: operacion }); cargarMisCitas(); } catch (error) { toast.error('Error'); }
  };

  const confirmarCitaOficial = async () => {
    if (verificarChoqueDeHora(fechaHoraAdmin, parseInt(duracionAdmin), citaSeleccionada.id)) {
      toast.error('⚠️ ¡Cuidado! Esta hora choca con otra cita confirmada.');
      return; 
    }

    const toastId = toast.loading('Confirmando cita...');
    const horaOriginal = formatoFechaInput(citaSeleccionada.fecha_hora);
    const seCambioHora = fechaHoraAdmin !== horaOriginal;

    try {
      await axios.post(`https://u-itas.onrender.com/api/citas/${citaSeleccionada.id}/confirmar_final/`, {
        fecha_hora: fechaHoraAdmin,
        hora_cambiada: seCambioHora,
        duracion_estimada: parseInt(duracionAdmin)
      });
      toast.dismiss(toastId);
      toast.success('¡Cita confirmada oficialmente!');
      setCitaSeleccionada(null); 
      cargarTodasLasCitas();     
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Hubo un error al confirmar.');
    }
  };

  const confirmarCitaDirecta = async (citaId) => {
    try { await axios.post(`https://u-itas.onrender.com/api/citas/${citaId}/confirmar_final/`); toast.success('¡Cita confirmada!'); cargarTodasLasCitas(); } catch (error) { toast.error('Error'); }
  };

  const guardarNotasClienta = async () => {
    try { await axios.patch(`https://u-itas.onrender.com/api/clientes/${citaSeleccionada.cliente}/perfil/`, { notas_internas: infoClienta?.notas_internas || "" }); toast.success('¡Notas guardadas!'); } catch (error) { toast.error(`Error al guardar notas`); }
  };

  const agendarEnCalendario = (cita) => {
    const d = new Date(formatoFechaInput(cita.fecha_hora));
    const fechaInicio = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const duracion = cita.duracion_estimada || 120;
    const fechaFin = new Date(d.getTime() + duracion * 60000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const titulo = `Stellar Nails - Reserva ${cita.codigo_pago || cita.id}`;
    const detalles = `Sistema: ${cita.sistema_unas || 'No especificado'}%0AExtras: S/ ${cita.costo_total}%0ANotas: ${cita.notas_cliente || 'Ninguna'}`;
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titulo}&dates=${fechaInicio}/${fechaFin}&details=${detalles}`, '_blank');
  };

  const calcularTotalSeguro = () => {
    if (!citaSeleccionada) return 0;
    if (['cotizada', 'precio_aceptado', 'confirmada'].includes(citaSeleccionada.estado)) return parseFloat(citaSeleccionada.costo_total) || parseFloat(citaSeleccionada.precio_base) || 0;
    return (parseFloat(precioBase) || 0) + detallesCalculadora.reduce((acc, e) => acc + ((parseFloat(e.precio) || 0) * (parseInt(e.cantidad) || 1)), 0);
  };

  const agregarAlCatalogo = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', e.target.nombreDiseno.value);
    if (e.target.descripcionDiseno.value) formData.append('descripcion', e.target.descripcionDiseno.value);
    formData.append('imagen', e.target.fotoNueva.files[0]);
    try { await axios.post('https://u-itas.onrender.com/api/catalogo/', formData, { headers: { 'Content-Type': 'multipart/form-data' }}); toast.success('¡Agregado!'); e.target.reset(); cargarCatalogo(); } catch (error) { toast.error('Error.'); }
  };

  const eliminarDelCatalogo = async (id) => {
    if (!window.confirm("¿Borrar?")) return;
    try { await axios.delete(`https://u-itas.onrender.com/api/catalogo/${id}/`); toast.success('Borrado.'); cargarCatalogo(); } catch (error) { toast.error('Error.'); }
  };

  const crearInsumo = async (e) => {
    e.preventDefault();
    try { await axios.post('https://u-itas.onrender.com/api/insumos/', { nombre: e.target.nombreInsumo.value, precio: parseFloat(e.target.precioInsumo.value) }); toast.success('¡Agregado!'); e.target.reset(); cargarInsumos(); } catch (error) { toast.error(`Error`); }
  };

  const borrarInsumo = async (id) => {
    if (!window.confirm("¿Estás segura?")) return;
    try { await axios.delete(`https://u-itas.onrender.com/api/insumos/${id}/`); toast.success('Borrado.'); cargarInsumos(); } catch (error) { toast.error('Error.'); }
  };

  const citasFiltradas = todasLasCitas.filter(cita => {
    if (!busqueda) return true;
    const termino = busqueda.toLowerCase();
    const id = String(cita.id).toLowerCase();
    const codigo = cita.codigo_pago ? cita.codigo_pago.toLowerCase() : "";
    const estado = cita.estado ? cita.estado.toLowerCase() : ""; 
    return id.includes(termino) || codigo.includes(termino) || estado.includes(termino);
  });

  const citasPendientes = todasLasCitas.filter(c => c.estado === 'pendiente').length;
  const citasConfirmadas = todasLasCitas.filter(c => c.estado === 'confirmada').length;
  const ingresosProyectados = todasLasCitas
    .filter(c => ['cotizada', 'precio_aceptado', 'confirmada'].includes(c.estado))
    .reduce((suma, cita) => suma + (parseFloat(cita.costo_total) || parseFloat(cita.precio_base) || 0), 0);

  return (
    <div className="salon-container">
      <Toaster position="top-center" reverseOrder={false} />

      {vista !== 'admin-panel' && (
        <header className="header-principal" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          {/* 👇 AQUI CAMBIAMOS LA IMAGEN PARA QUE USE LA IMPORTADA 👇 */}
          <img src="/rosa.png" alt="Stellar Nails Logo" style={{ height: '200px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
          <h1 style={{margin: '0', fontSize: '2rem'}}>Stellar</h1>
          <p style={{marginTop: '5px'}}>Expertos en estructura y diseño premium.</p>
          <nav className="navegacion" style={{marginTop: '15px'}}>
            <button onClick={() => setVista('inicio')} className="btn-nav">Catálogo</button>
            {!usuarioActual ? (
              <button onClick={() => setVista('login')} className="btn-agendar">Iniciar Sesión</button>
            ) : (
              <>
                <button onClick={() => { setVista('agendar'); setCitaEnviada(false); setFechaElegida(""); setHoraElegida(""); }} className="btn-agendar">Agendar Cita</button>
                <button onClick={cargarMisCitas} className="btn-nav">Mis Citas</button>
                <button onClick={cerrarSesion} className="btn-nav" style={{borderColor: '#ccc', color: '#888'}}>Salir</button>
              </>
            )}
          </nav>
        </header>
      )}

      {vista === 'terminos' && (
        <section className="seccion-catalogo" style={{maxWidth: '800px', margin: '0 auto', textAlign: 'left', background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
          <h2 style={{color: 'var(--taupe-brown)', borderBottom: '2px solid var(--pastel-pink)', paddingBottom: '10px'}}>Términos y Políticas de Stellar</h2>
          
          <div style={{color: 'var(--taupe-brown)', lineHeight: '1.8', fontSize: '1.05rem', marginTop: '20px'}}>
            <p><strong>1. Reservas y Abonos:</strong> Toda cita requiere un abono del 50% del total cotizado para ser confirmada en la agenda. Este monto <u>NO es reembolsable</u> bajo ninguna circunstancia en caso de inasistencia o cancelación por parte de la clienta.</p>
            
            <p><strong>2. Puntualidad:</strong> Entendemos que pueden ocurrir imprevistos, por lo que brindamos una tolerancia máxima de 15 minutos. Pasado este tiempo, la cita se cancela automáticamente sin derecho a reembolso, para no perjudicar a la siguiente clienta.</p>
            
            <p><strong>3. Salud de las Uñas:</strong> Por motivos estrictos de bioseguridad, nos reservamos el derecho de no realizar aplicaciones sobre uñas que presenten hongos, heridas abiertas o infecciones visibles.</p>
            
            <p><strong>4. Garantía:</strong> Ofrecemos 3 días de garantía por desprendimiento prematuro del producto. Esta garantía queda anulada si la uña se quiebra por golpes, uso de químicos agresivos sin guantes, o uso de la uña como herramienta.</p>
            
            <p><strong>5. Acompañantes:</strong> Para brindarte un momento de completa relajación y debido al espacio del estudio, te pedimos acudir a tu cita sin acompañantes ni mascotas.</p>
          </div>
          <div style={{textAlign: 'center', marginTop: '30px'}}>
            <button onClick={() => setVista('inicio')} className="btn-submit">Volver al inicio</button>
          </div>
        </section>
      )}

      {vista === 'inicio' && (
        <section className="seccion-catalogo">
          <h2>Inspírate en Stellar</h2>
          <div className="grid-catalogo">
            {catalogo.length === 0 && <p className="text-loading">Cargando diseños...</p>}
            {catalogo.map(modelo => (
              <div key={modelo.id} className="tarjeta-modelo">
                <img src={modelo.imagen} alt={modelo.nombre} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                <h3 style={{ marginBottom: '5px' }}>{modelo.nombre}</h3>
                {modelo.descripcion && <p style={{ fontSize: '0.9rem', color: 'var(--taupe-brown)', padding: '0 15px 15px 15px', margin: '0', fontStyle: 'italic' }}>{modelo.descripcion}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {vista === 'login' && (
        <section className="seccion-formulario">
          <form onSubmit={manejarAuth} className="formulario">
            <h2 style={{ color: 'var(--taupe-brown)', marginTop: 0, textAlign: 'center' }}>{modoAuth === 'login' ? 'Bienvenida' : 'Únete a Stellar'}</h2>
            <input type="email" name="email" placeholder="Correo electrónico" required />
            <input type="password" name="password" placeholder="Contraseña" required />
            <button type="submit" className="btn-submit">{modoAuth === 'login' ? 'Entrar' : 'Crear Cuenta'}</button>
            <p style={{ textAlign: 'center', margin: 0, cursor: 'pointer', color: 'var(--dusty-pink)', fontWeight: 'bold' }} onClick={() => setModoAuth(modoAuth === 'login' ? 'registro' : 'login')}>
              {modoAuth === 'login' ? '¿No tienes cuenta? Regístrate aquí.' : '¿Ya tienes cuenta? Ingresa aquí.'}
            </p>
          </form>
        </section>
      )}

      {vista === 'mis-citas' && usuarioActual && (
        <section className="seccion-catalogo">
          <h2>Tus Solicitudes, {usuarioActual.email.split('@')[0]}</h2>
          <div className="grid-citas">
            {misCitas.length === 0 && <p className="text-loading">Aún no tienes citas agendadas.</p>}
            {misCitas.map(cita => {
              const totalClienta = parseFloat(cita.costo_total) || parseFloat(cita.precio_base) || 0;
              const adelantoClienta = (totalClienta / 2).toFixed(2); 
              
              const cajaHoraColor = cita.estado === 'cotizada' ? (cita.hora_modificada ? '#FFF3CD' : '#f0faea') : 'transparent';
              const bordeHoraColor = cita.estado === 'cotizada' ? (cita.hora_modificada ? '4px solid #f0ad4e' : '4px solid var(--sage-green)') : 'none';

              return (
              <div key={cita.id} className="tarjeta-cita" style={{ border: cita.estado === 'cotizada' ? '2px solid var(--sage-green)' : 'none', opacity: cita.estado === 'cancelada' ? 0.6 : 1 }}>
                
                <h3 style={{ borderBottom: '2px solid var(--pastel-pink)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Reserva: <span style={{color: 'var(--dusty-pink)'}}>{cita.codigo_pago || cita.id}</span></span>
                  {cita.estado === 'cancelada' && <span style={{fontSize: '0.9rem', background: '#d9534f', color: 'white', padding: '4px 10px', borderRadius: '12px'}}>Cancelada</span>}
                </h3>
                
                <div className="cita-detalle" style={{ background: cajaHoraColor, borderLeft: bordeHoraColor, padding: cita.estado === 'cotizada' ? '12px' : '0', borderRadius: '8px', alignItems: 'flex-start' }}>
                  <span>📅 Fecha y Hora:</span>
                  <div style={{textAlign: 'right'}}>
                    <strong style={{ color: cita.estado === 'cotizada' ? (cita.hora_modificada ? '#d9534f' : 'var(--sage-green-dark)') : (cita.estado === 'cancelada' ? '#888' : 'inherit'), textDecoration: cita.estado === 'cancelada' ? 'line-through' : 'none', fontSize: cita.estado === 'cotizada' ? '1.1rem' : '1rem' }}>
                      {mostrarFechaBonita(cita.fecha_hora)}
                    </strong>
                    
                    {cita.estado !== 'pendiente' && cita.estado !== 'cancelada' && (
                      <div style={{fontSize: '0.85rem', color: '#666', marginTop: '5px'}}>
                        ⏳ Duración est: <strong>{formatoDuracion(cita.duracion_estimada)}</strong>
                      </div>
                    )}

                    {cita.estado === 'cotizada' && (
                       cita.hora_modificada ? (
                         <div style={{fontSize: '0.8rem', color: '#d9534f', fontWeight: 'bold', marginTop: '3px'}}>⚠️ Hora ajustada por Stellar</div>
                       ) : (
                         <div style={{fontSize: '0.8rem', color: 'var(--sage-green-dark)', marginTop: '3px'}}>✅ Hora original aprobada</div>
                       )
                    )}
                  </div>
                </div>

                <div className="cita-detalle"><span>💅 Sistema:</span><strong>{cita.sistema_unas || 'No especificado'}</strong></div>
                {cita.edad && <div className="cita-detalle"><span>🎂 Edad:</span><strong>{cita.edad} años</strong></div>}
                
                {cita.estado !== 'cancelada' && (
                  <div className="cita-detalle" style={{ marginBottom: '10px' }}><span>Estado:</span><span className={`badge ${cita.estado}`}>{cita.estado_display}</span></div>
                )}

                {cita.recomendacion_admin && cita.estado !== 'cancelada' && (
                  <div style={{ marginTop: '10px', padding: '15px', background: '#F9F1F0', borderLeft: '5px solid var(--dusty-pink)', borderRadius: '8px', color: 'var(--taupe-brown)' }}>
                    <strong style={{ color: 'var(--dusty-pink)', fontSize: '1.1rem' }}>💡 Recomendación de Stellar:</strong>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem', lineHeight: '1.4' }}>{cita.recomendacion_admin}</p>
                  </div>
                )}

                {cita.estado === 'cotizada' && (
                  <div style={{ marginTop: '15px', background: 'white', padding: '15px', borderRadius: '10px', border: '2px dashed var(--pastel-pink)' }}>
                    <h4 style={{ marginTop: 0, color: 'var(--taupe-brown)', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🧾 Detalle del diseño propuesto:</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '15px' }}>
                      <li style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', color: 'var(--taupe-brown)' }}><span>✨ Diseño principal (Base)</span><strong>S/ {cita.precio_base}</strong></li>
                      {(cita.desglose_cotizacion || []).map((extra, idx) => {
                        const cantActual = parseInt(extra.cantidad || 0);
                        const cantMax = parseInt(extra.cantidad_original || extra.cantidad || 0); 
                        const estaBorrado = cantActual === 0;
                        return (
                          <li key={idx} style={{ padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: estaBorrado ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                            <span style={{ color: 'var(--taupe-brown)', fontSize: '0.95rem', textDecoration: estaBorrado ? 'line-through' : 'none' }}>➕ {extra.nombre}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FAFAFA', borderRadius: '20px', padding: '2px 8px', border: '1px solid #e0e0e0' }}>
                                <button onClick={() => ajustarExtraClienta(cita.id, idx, 'restar')} disabled={estaBorrado} style={{ background: 'none', color: estaBorrado ? '#ccc' : '#d9534f', border: 'none', cursor: estaBorrado ? 'not-allowed' : 'pointer', fontSize: '1.2rem', fontWeight: 'bold', padding: '0 5px' }}>-</button>
                                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--taupe-brown)', minWidth: '15px', textAlign: 'center' }}>{cantActual}</span>
                                <button onClick={() => ajustarExtraClienta(cita.id, idx, 'sumar')} disabled={cantActual === cantMax} style={{ background: 'none', color: cantActual === cantMax ? '#ccc' : 'var(--sage-green)', border: 'none', cursor: cantActual === cantMax ? 'not-allowed' : 'pointer', fontSize: '1.2rem', fontWeight: 'bold', padding: '0 5px' }}>+</button>
                              </div>
                              <strong style={{ color: 'var(--dusty-pink)', textDecoration: estaBorrado ? 'line-through' : 'none', minWidth: '50px', textAlign: 'right' }}>S/ {parseFloat(extra.precio) * cantActual}</strong>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px', color: 'var(--taupe-brown)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>Total a pagar: </span>
                        <span style={{ color: 'var(--dusty-pink)', fontSize: '1.6rem', fontWeight: 'bold' }}>S/ {totalClienta}</span>
                    </div>

                    <div style={{ marginTop: '15px', background: '#eef2f5', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #4285F4' }}>
                        <p style={{ margin: '0 0 5px 0', color: 'var(--taupe-brown)', fontWeight: 'bold', fontSize: '1.1rem' }}>⚠️ Reserva de Cupo (50%)</p>
                        <p style={{ margin: 0, color: 'var(--taupe-brown)', fontSize: '0.95rem' }}>
                          Para confirmar, deberás abonar <strong>S/ {adelantoClienta}</strong> vía Yape o Plin.
                        </p>
                    </div>
                  </div>
                )}
                
                {cita.notas_cliente && <div style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--taupe-brown)', background: '#FAFAFA', padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap' }}><strong>📝 Notas:</strong> {cita.notas_cliente}</div>}
                
                {cita.estado === 'cotizada' && (
                  <>
                    {citaPidiendoCambio === cita.id ? (
                      <div style={{ marginTop: '15px', padding: '20px', background: '#ffffff', border: '1px solid var(--cream-beige)', borderRadius: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', animation: 'fadeIn 0.3s' }}>
                        <label style={{ fontWeight: 'bold', color: 'var(--taupe-brown)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '1.1rem' }}>
                          <span>✍️</span> ¿Qué te gustaría cambiar?
                        </label>
                        <textarea
                          autoFocus
                          placeholder="Ej: Hola! Me gustaría mantener mi sistema de acrílico original, por favor..."
                          value={motivoCambio}
                          onChange={(e) => setMotivoCambio(e.target.value)}
                          style={{ width: '100%', minHeight: '90px', padding: '15px', borderRadius: '10px', border: '2px solid #f0f0f0', outline: 'none', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical', backgroundColor: '#fafafa' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => { setCitaPidiendoCambio(null); setMotivoCambio(""); }} style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#666', cursor: 'pointer', fontWeight: 'bold', flex: 1, minWidth: '100px', transition: 'all 0.2s' }}>
                            Cancelar
                          </button>
                          <button onClick={() => enviarSolicitudCambio(cita.id)} style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: 'var(--dusty-pink)', color: 'white', cursor: 'pointer', fontWeight: 'bold', flex: 2, minWidth: '150px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                            ✨ Enviar a Stellar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                        <button onClick={() => aceptarPresupuesto(cita.id)} className="btn-submit" style={{flex: 2, minWidth: '200px', background: 'var(--sage-green)', color: 'white', padding: '15px', fontSize: '1.1rem'}}>
                          ✅ Aceptar Precio y Hora
                        </button>
                        <button onClick={() => { setCitaPidiendoCambio(cita.id); setMotivoCambio(""); }} className="btn-submit" style={{flex: 1, minWidth: '150px', background: '#fff', color: 'var(--dusty-pink)', border: '2px solid var(--dusty-pink)', padding: '15px', fontSize: '1rem'}}>
                          ✍️ Solicitar Cambios
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                {cita.estado === 'precio_aceptado' && (
                  <div style={{marginTop: '15px', padding: '20px', background: '#FFF3CD', color: '#856404', borderRadius: '10px', textAlign: 'center', border: '2px dashed #ffeeba'}}>
                    <h4 style={{margin: '0 0 10px 0'}}>⏳ ¡Casi listo para brillar!</h4>
                    <p style={{margin: '0 0 10px 0', fontSize: '1rem'}}>
                      Transfiere <strong>S/ {adelantoClienta}</strong> por Yape o Plin al:<br/>
                      <strong style={{fontSize: '1.5rem', display: 'block', margin: '10px 0', color: '#000'}}>{NUMERO_YAPE}</strong>
                      <span style={{fontSize: '0.85rem', color: '#d9534f', fontWeight: 'bold'}}>
                        ⚠️ IMPORTANTE: Pon "{cita.codigo_pago || cita.id}" en el mensaje de Yape/Plin.
                      </span>
                    </p>
                    
                    <a 
                      href={`https://wa.me/${NUMERO_WHATSAPP}?text=Hola%20Stellar!%20%E2%9C%A8%20Ya%20pagu%C3%A9%20mi%20reserva%20con%20el%20c%C3%B3digo%20${cita.codigo_pago || cita.id}.%20Aqu%C3%AD%20mi%20voucher:`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{display: 'inline-block', marginTop: '10px', background: '#25D366', color: 'white', padding: '12px 20px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(37,211,102,0.3)'}}
                    >
                      📱 Enviar voucher por WhatsApp
                    </a>
                  </div>
                )}

                {cita.estado !== 'cancelada' && (
                  <div style={{textAlign: 'center', marginTop: '20px'}}>
                     <button onClick={() => cancelarCitaClienta(cita.id)} style={{background: 'transparent', border: 'none', color: '#d9534f', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold'}}>
                        ❌ Cancelar mi cita
                     </button>
                  </div>
                )}

              </div>
            )})}
          </div>
        </section>
      )}

      {vista === 'agendar' && usuarioActual && (
        <section className="seccion-formulario">
          {citaEnviada ? (
            <div className="exito-envio" style={{textAlign: 'center', background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}}>
              <h3 style={{color: 'var(--dusty-pink)', fontSize: '1.8rem'}}>¡Solicitud Recibida!</h3>
              <p style={{margin: '15px 0', fontSize: '1.2rem', color: 'var(--taupe-brown)'}}>Evaluaremos tu diseño y pronto verás el presupuesto en tu panel.</p>
              <button onClick={cargarMisCitas} className="btn-submit">Ver Mis Citas</button>
            </div>
          ) : (
            <div className="formulario">
              <h2 style={{marginTop: 0, color: 'var(--taupe-brown)'}}>Reserva tu espacio premium</h2>
              <form onSubmit={manejarEnvioCita} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                
                <div style={{background: '#FAFAFA', padding: '20px', borderRadius: '12px', border: '2px dashed var(--pastel-pink)'}}>
                  <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '10px', display: 'block'}}>1. Elige una fecha para tu cita:</label>
                  <input 
                    type="date" 
                    value={fechaElegida}
                    min={new Date().toISOString().split('T')[0]} 
                    onChange={(e) => { setFechaElegida(e.target.value); setHoraElegida(""); }} 
                    required 
                    style={{padding: '15px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', width: '100%', outline: 'none', marginBottom: '15px'}} 
                  />

                  {fechaElegida && (
                    <>
                      <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '10px', display: 'block'}}>2. Selecciona un turno disponible:</label>
                      <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                        {horasDisponiblesHoy.length > 0 ? (
                          horasDisponiblesHoy.map(hora => (
                            <button 
                              key={hora}
                              type="button" 
                              onClick={() => setHoraElegida(hora)}
                              style={{
                                padding: '10px 20px', 
                                borderRadius: '30px', 
                                border: horaElegida === hora ? 'none' : '2px solid var(--dusty-pink)', 
                                background: horaElegida === hora ? 'var(--dusty-pink)' : 'white', 
                                color: horaElegida === hora ? 'white' : 'var(--dusty-pink)', 
                                fontWeight: 'bold', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {hora}
                            </button>
                          ))
                        ) : (
                          <p style={{color: '#d9534f', margin: 0, fontWeight: 'bold'}}>¡Ups! Ya no hay turnos disponibles este día. Prueba con otra fecha. 📅</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '-10px'}}>Tu edad (Años):</label>
                <input type="number" id="edadCliente" required min="10" max="99" placeholder="Ej: 22" style={{padding: '15px', borderRadius: '12px', border: '2px solid var(--cream-beige)', background: '#FAFAFA', fontSize: '1rem', width: '100%', outline: 'none'}} />
                
                <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '-10px'}}>Sistema de Uñas que deseas:</label>
                <select id="sistemaUnas" required style={{padding: '15px', borderRadius: '12px', border: '2px solid var(--cream-beige)', background: '#FAFAFA', fontSize: '1rem', width: '100%', outline: 'none'}}>
                  <option value="">Selecciona una opción...</option>
                  <option value="Rubber">Rubber</option>
                  <option value="Soft Gel">Soft Gel</option>
                  <option value="Acrílico">Acrílico</option>
                  <option value="Gel de Construcción">Gel de Construcción</option>
                  <option value="Esmalte en Gel Semipermanente">Esmalte en Gel Semipermanente</option>
                  <option value="Polygel">Polygel</option>
                  <option value="Esmaltado Tradicional">Esmaltado Tradicional</option>
                </select>
                
                <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '-10px'}}>3. Sube tu diseño de inspiración:</label>
                <input type="file" id="fotoDiseno" accept="image/*" required />
                
                <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '-10px'}}>4. Sube la foto de tu uña (Perfil lateral):</label>
                <input type="file" id="fotoPerfil" accept="image/*" required />
                
                <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', marginBottom: '-10px'}}>Notas adicionales para tu manicurista:</label>
                <textarea id="notas" placeholder="Ej: Me gustaría cambiar el color rosado..."></textarea>
                
                <button type="submit" className="btn-submit" disabled={!horaElegida} style={{opacity: !horaElegida ? 0.5 : 1}}>Agendar Solicitud</button>
              </form>
            </div>
          )}
        </section>
      )}

      {vista === 'admin-panel' && usuarioActual && (
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <h1 className="admin-sidebar-logo">Stellar</h1>
            <nav className="admin-menu">
              <button className={`admin-menu-btn ${adminTab === 'dashboard' ? 'activo' : ''}`} onClick={() => setAdminTab('dashboard')}>📊 Dashboard</button>
              <button className={`admin-menu-btn ${adminTab === 'solicitudes' ? 'activo' : ''}`} onClick={() => setAdminTab('solicitudes')}>📅 Solicitudes</button>
              <button className={`admin-menu-btn ${adminTab === 'catalogo' ? 'activo' : ''}`} onClick={() => setAdminTab('catalogo')}>💅 Catálogo</button>
              <button className={`admin-menu-btn ${adminTab === 'insumos' ? 'activo' : ''}`} onClick={() => setAdminTab('insumos')}>💰 Insumos</button>
              <div style={{ flex: 1 }}></div>
              <button onClick={cerrarSesion} className="admin-menu-btn" style={{ color: '#ffb6c1' }}>⬅ Cerrar Sesión</button>
            </nav>
          </aside>

          <main className="admin-content">
            {adminTab === 'dashboard' && (
              <>
                <header className="admin-header"><h2>Dashboard de Stellar 📊</h2><div className="admin-perfil">👑 Admin: {usuarioActual.email.split('@')[0]}</div></header>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #28a745', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--taupe-brown)', fontSize: '1.2rem' }}>💰 Ingresos Proyectados</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#28a745' }}>S/ {ingresosProyectados.toFixed(2)}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#888' }}>Total de citas cotizadas o confirmadas</p>
                  </div>
                  <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #ffc107', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--taupe-brown)', fontSize: '1.2rem' }}>⏳ Por Evaluar</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{citasPendientes} <span style={{fontSize: '1rem', color: '#888'}}>solicitudes</span></p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#888' }}>Requieren armar presupuesto</p>
                  </div>
                  <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #4285F4', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--taupe-brown)', fontSize: '1.2rem' }}>✅ Agendadas</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#4285F4' }}>{citasConfirmadas} <span style={{fontSize: '1rem', color: '#888'}}>citas</span></p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#888' }}>Listas para trabajar</p>
                  </div>
                </div>

                <div className="admin-tarjeta-blanca">
                  <h3 style={{ color: 'var(--taupe-brown)', marginTop: 0, fontSize: '1.5rem' }}>¡Central de Mando Lista! 🚀</h3>
                  <p style={{ color: 'var(--taupe-brown)', lineHeight: '1.6', fontSize: '1.1rem' }}>Desde aquí tienes el control absoluto de tu negocio.</p>
                </div>
              </>
            )}

            {adminTab === 'solicitudes' && (
              <>
                <header className="admin-header"><h2>Control de Solicitudes</h2><div className="admin-perfil">👑 Admin: {usuarioActual.email.split('@')[0]}</div></header>
                <div className="admin-tarjeta-blanca">
                  {!citaSeleccionada ? (
                    <>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center'}}>
                         <input 
                           type="text" 
                           placeholder="🔍 Buscar por Código o Estado..." 
                           value={busqueda}
                           onChange={(e) => setBusqueda(e.target.value)}
                           style={{padding: '10px 15px', borderRadius: '8px', border: '2px solid var(--cream-beige)', width: '300px', outline: 'none', fontSize: '1rem', color: 'var(--taupe-brown)'}}
                         />
                         <button onClick={cargarTodasLasCitas} className="btn-submit" style={{padding: '10px 20px', fontSize: '1rem'}}>🔄 Actualizar Lista</button>
                      </div>

                      <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                        <thead>
                          <tr style={{borderBottom: '2px solid var(--cream-beige)', color: 'var(--taupe-brown)'}}>
                            <th style={{padding: '15px'}}>ID / Código</th><th style={{padding: '15px'}}>Fecha</th><th style={{padding: '15px'}}>Estado</th><th style={{padding: '15px'}}>Total</th><th style={{padding: '15px'}}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {citasFiltradas.length === 0 ? (<tr><td colSpan="5" style={{textAlign: 'center', padding: '20px', color: 'var(--sage-green-dark)'}}>No hay solicitudes que coincidan con tu búsqueda.</td></tr>) : (
                            citasFiltradas.map(cita => (
                              <tr key={cita.id} style={{borderBottom: '1px solid var(--cream-beige)', opacity: cita.estado === 'cancelada' ? 0.5 : 1}}>
                                <td style={{padding: '15px'}}>
                                  <div style={{fontWeight: 'bold', color: 'var(--taupe-brown)'}}>#{cita.id}</div>
                                  {cita.codigo_pago && (
                                    <div style={{fontSize: '0.85rem', color: 'var(--dusty-pink)', fontWeight: 'bold'}}>Cod: {cita.codigo_pago}</div>
                                  )}
                                </td>
                                <td style={{padding: '15px'}}>{mostrarFechaBonita(cita.fecha_hora)}</td>
                                <td style={{padding: '15px'}}>
                                  {cita.estado === 'cancelada' ? (
                                    <span style={{background: '#d9534f', color: 'white', padding: '5px 10px', borderRadius: '12px', fontSize: '0.85rem'}}>Cancelada</span>
                                  ) : (
                                    <span className={`badge ${cita.estado}`}>{cita.estado_display}</span>
                                  )}
                                </td>
                                <td style={{padding: '15px', color: 'var(--dusty-pink)', fontWeight: 'bold'}}>{['cotizada', 'precio_aceptado', 'confirmada'].includes(cita.estado) ? `S/ ${parseFloat(cita.costo_total) || parseFloat(cita.precio_base) || 0}` : 'Pendiente'}</td>
                                
                                <td style={{padding: '15px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                                  <button onClick={() => abrirEvaluacion(cita)} style={{background: 'var(--sage-green)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>Ver 🔍</button>
                                  
                                  {cita.estado === 'cancelada' && cita.cancelado_por === 'admin' && (
                                    <button onClick={() => restaurarCitaDirecta(cita.id)} style={{background: '#ffc107', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>🔄 Deshacer</button>
                                  )}
                                  
                                  {cita.estado === 'cancelada' && cita.cancelado_por === 'cliente' && (
                                    <span style={{fontSize: '0.85rem', color: '#d9534f', fontWeight: 'bold'}}>Cancelada por Clienta</span>
                                  )}

                                  {cita.estado === 'precio_aceptado' && <button onClick={() => confirmarCitaDirecta(cita.id)} style={{background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>✅ Confirmar Pago</button>}
                                  {cita.estado === 'confirmada' && <button onClick={() => agendarEnCalendario(cita)} style={{background: '#4285F4', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>📅 Al Calendario</button>}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </>
                  ) : (
                    <div className="evaluacion-detalle">
                      <button onClick={() => setCitaSeleccionada(null)} className="btn-nav" style={{marginBottom: '20px', padding: '8px 15px'}}>⬅ Volver</button>
                      
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--pastel-pink)', paddingBottom: '10px'}}>
                        <h3 style={{fontSize: '1.8rem', color: 'var(--taupe-brown)', margin: 0}}>Reserva: <span style={{color: 'var(--dusty-pink)'}}>{citaSeleccionada.codigo_pago || citaSeleccionada.id}</span></h3>
                        <span className={`badge ${citaSeleccionada.estado}`} style={{fontSize: '1.2rem', padding: '8px 15px'}}>{citaSeleccionada.estado_display}</span>
                      </div>

                      <div className="formulario" style={{ marginTop: '20px', padding: '30px', borderLeft: '6px solid var(--dusty-pink)' }}>
                        <h3 style={{ color: 'var(--taupe-brown)', marginBottom: '20px', borderBottom: '1px solid var(--cream-beige)', paddingBottom: '10px', marginTop: 0 }}>👤 Perfil: {infoClienta?.nombre || 'Clienta'}</h3>
                        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--taupe-brown)' }}>Visitas previas:</p>
                            <p style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--dusty-pink)' }}>{todasLasCitas.filter(c => c.cliente === citaSeleccionada.cliente).length} veces</p>
                            <p style={{ margin: '20px 0 0 0', fontSize: '1.1rem', color: 'var(--taupe-brown)' }}>Edad:</p>
                            <p style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--dusty-pink)' }}>{citaSeleccionada.edad ? `${citaSeleccionada.edad} años` : 'No especificada'}</p>
                          </div>
                          <div style={{ flex: 2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontWeight: 'bold', color: 'var(--taupe-brown)' }}>Notas internas (Privado):</label>
                            <textarea value={infoClienta?.notas_internas || ""} onChange={(e) => setInfoClienta({...infoClienta, notas_internas: e.target.value})} style={{ width: '100%', minHeight: '90px', padding: '15px', borderRadius: '12px', border: '2px solid var(--cream-beige)', outline: 'none', backgroundColor: '#FAFAFA' }} />
                            <button onClick={guardarNotasClienta} className="btn-submit" style={{ padding: '10px 20px', width: 'fit-content', alignSelf: 'flex-end' }}>Guardar Notas</button>
                          </div>
                        </div>
                      </div>

                      <div style={{marginTop: '20px', background: 'var(--cream-beige)', padding: '20px', borderRadius: '15px', borderLeft: '5px solid var(--dusty-pink)'}}>
                        <h4 style={{color: 'var(--taupe-brown)', marginBottom: '10px'}}>💅 Sistema a realizar:</h4>
                        <select 
                          value={sistemaAdmin} 
                          onChange={(e) => setSistemaAdmin(e.target.value)} 
                          disabled={['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado)}
                          style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', outline: 'none', width: '100%', maxWidth: '400px'}}
                        >
                          <option value="Rubber">Rubber</option>
                          <option value="Soft Gel">Soft Gel</option>
                          <option value="Acrílico">Acrílico</option>
                          <option value="Gel de Construcción">Gel de Construcción</option>
                          <option value="Esmalte en Gel Semipermanente">Esmalte en Gel Semipermanente</option>
                          <option value="Polygel">Polygel</option>
                          <option value="Esmaltado Tradicional">Esmaltado Tradicional</option>
                        </select>
                        <p style={{fontSize: '0.85rem', color: '#888', margin: '5px 0 0 0'}}>*La clienta pidió: <strong>{citaSeleccionada.sistema_unas || "Nada"}</strong>. Puedes cambiarlo si por su salud o edad le conviene otro.</p>
                      </div>

                      <div style={{marginTop: '20px', background: '#FFF', padding: '20px', borderRadius: '15px', border: '2px dashed var(--dusty-pink)'}}>
                        <label style={{ fontWeight: 'bold', color: 'var(--taupe-brown)', fontSize: '1.1rem' }}>💡 ¿Quieres explicarle por qué cambiaste el sistema o darle un mensaje?</label>
                        <textarea value={recomendacionAdmin} onChange={(e) => setRecomendacionAdmin(e.target.value)} placeholder="Ej: Hola! Por tu edad (15 años) he ajustado tu presupuesto a Soft Gel para proteger tu uña natural..." style={{ width: '100%', minHeight: '80px', padding: '15px', borderRadius: '12px', border: '1px solid #ccc', outline: 'none', marginTop: '10px', fontFamily: 'inherit' }} />
                      </div>

                      <div style={{display: 'flex', gap: '30px', marginTop: '20px', flexWrap: 'wrap'}}>
                        <div style={{flex: 1, minWidth: '300px'}}><h4 style={{color: 'var(--dusty-pink)', marginBottom: '10px'}}>1. Diseño</h4><img src={citaSeleccionada.foto_diseno} alt="Diseño" style={{width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '15px'}} /></div>
                        <div style={{flex: 1, minWidth: '300px'}}><h4 style={{color: 'var(--dusty-pink)', marginBottom: '10px'}}>2. Perfil</h4><img src={citaSeleccionada.foto_perfil_una} alt="Uña" style={{width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '15px'}} /></div>
                      </div>

                      <div style={{marginTop: '40px', background: 'white', padding: '30px', borderRadius: '15px', borderTop: '4px solid var(--dusty-pink)'}}>
                        <h4 style={{color: 'var(--taupe-brown)', fontSize: '1.5rem', marginBottom: '20px'}}>🧮 Presupuesto y Hora</h4>
                        
                        <div style={{marginBottom: '25px', background: '#eef2f5', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', borderLeft: '4px solid #4285F4', flexWrap: 'wrap', gap: '15px'}}>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', fontSize: '1.1rem', marginRight: '15px'}}>🕒 Ajustar Hora:</label>
                            <input 
                              type="datetime-local" 
                              value={fechaHoraAdmin} 
                              onChange={(e) => setFechaHoraAdmin(e.target.value)} 
                              disabled={['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado)} 
                              style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', outline: 'none'}} 
                            />
                          </div>
                          <div style={{display: 'flex', alignItems: 'center'}}>
                            <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', fontSize: '1.1rem', marginRight: '15px'}}>⏳ Tiempo (min):</label>
                            <input 
                              type="number" 
                              value={duracionAdmin} 
                              onChange={(e) => setDuracionAdmin(e.target.value)} 
                              disabled={['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado)} 
                              style={{padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', outline: 'none', width: '90px'}} 
                            />
                          </div>
                        </div>

                        <div style={{marginBottom: '20px', background: 'var(--cream-beige)', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center'}}>
                          <label style={{fontWeight: 'bold', color: 'var(--taupe-brown)', fontSize: '1.1rem'}}>Precio Base (S/):</label>
                          <input type="number" value={precioBase} onChange={(e) => setPrecioBase(e.target.value)} disabled={['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado)} style={{width: '120px', marginLeft: '15px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1.1rem', fontWeight: 'bold'}} />
                        </div>

                        {!['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado) && (
                          <div style={{ background: '#FAFAFA', padding: '20px', borderRadius: '15px', border: '2px dashed var(--dusty-pink)' }}>
                            <div style={{display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap'}}>
                              <select id="selectInsumo" style={{flex: 1, minWidth: '200px', padding: '12px', borderRadius: '10px', border: '1px solid #ccc'}}><option value="">-- Extra de tu lista --</option>{insumosDisponibles.map(i => <option key={i.id} value={i.id}>{i.nombre} - S/ {i.precio}</option>)}</select>
                              <input type="number" id="inputCantidad" defaultValue="1" min="1" style={{width: '80px', padding: '12px', borderRadius: '10px', border: '1px solid #ccc'}} />
                              <button onClick={agregarInsumo} style={{background: 'var(--dusty-pink)', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'}}>Agregar</button>
                            </div>
                            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                              <input type="text" id="inputNombrePersonalizado" placeholder="Ej: Dije 3D" style={{flex: 2, minWidth: '150px', padding: '12px', borderRadius: '10px', border: '1px solid #ccc'}} />
                              <input type="number" id="inputPrecioPersonalizado" placeholder="Precio (S/)" min="0" step="0.50" style={{flex: 1, minWidth: '100px', padding: '12px', borderRadius: '10px', border: '1px solid #ccc'}} />
                              <input type="number" id="inputCantidadPersonalizado" defaultValue="1" min="1" style={{width: '80px', padding: '12px', borderRadius: '10px', border: '1px solid #ccc'}} />
                              <button onClick={agregarInsumoPersonalizado} style={{background: 'var(--taupe-brown)', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold'}}>Único</button>
                            </div>
                          </div>
                        )}

                        {detallesCalculadora.length > 0 && (
                          <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
                            <tbody>
                              {detallesCalculadora.map((item, index) => (
                                <tr key={index} style={{borderBottom: '1px solid #eee'}}>
                                  <td style={{padding: '10px'}}>{item.nombre} (x{item.cantidad})</td>
                                  <td style={{padding: '10px', fontWeight: 'bold', color: 'var(--taupe-brown)'}}>S/ {parseFloat(item.precio) * parseInt(item.cantidad)}</td>
                                  {!['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado) && (
                                    <td style={{padding: '10px', textAlign: 'right'}}><button onClick={() => setDetallesCalculadora(detallesCalculadora.filter((_, i) => i !== index))} style={{background: 'transparent', border: 'none', color: '#d9534f', cursor: 'pointer', fontSize: '1.2rem'}}>❌</button></td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}

                        <div style={{marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA', padding: '20px', borderRadius: '10px', border: '2px solid var(--cream-beige)'}}>
                          <span style={{fontSize: '1.2rem', color: 'var(--taupe-brown)', fontWeight: 'bold'}}>Total Cotizado:</span><span style={{fontSize: '2rem', fontWeight: 'bold', color: 'var(--dusty-pink)'}}>S/ {calcularTotalSeguro()}</span>
                        </div>

                        <div style={{marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                          {!['cotizada', 'precio_aceptado', 'confirmada', 'cancelada'].includes(citaSeleccionada.estado) && <button onClick={enviarCotizacion} style={{background: 'var(--sage-green)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer'}}>✉️ Enviar Presupuesto a Clienta</button>}
                          
                          {citaSeleccionada.estado !== 'cancelada' && (
                            <button onClick={cancelarCitaAdmin} style={{background: 'transparent', color: '#d9534f', border: '2px solid #d9534f', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer'}}>
                              ❌ Cancelar Cita
                            </button>
                          )}

                          {citaSeleccionada.estado === 'cancelada' && citaSeleccionada.cancelado_por === 'admin' && (
                            <button onClick={restaurarCitaAdmin} style={{background: '#ffc107', color: '#333', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer'}}>
                              🔄 Deshacer Cancelación
                            </button>
                          )}

                          {citaSeleccionada.estado === 'precio_aceptado' && <button onClick={confirmarCitaOficial} style={{background: '#28a745', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(40, 167, 69, 0.4)'}}>✅ Confirmar Pago y Cita</button>}
                          {citaSeleccionada.estado === 'confirmada' && <button onClick={() => agendarEnCalendario(citaSeleccionada)} style={{background: '#4285F4', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(66,133,244,0.3)'}}>📅 Agendar en Google Calendar</button>}
                        </div>

                      </div>
                    </div>    
                  )}
                </div>
              </>
            )}

            {adminTab === 'catalogo' && (
              <>
                <header className="admin-header"><h2>Gestor de Catálogo</h2><div className="admin-perfil">👑 Admin: {usuarioActual.email.split('@')[0]}</div></header>
                <div className="admin-tarjeta-blanca" style={{ marginBottom: '30px' }}>
                  <form onSubmit={agregarAlCatalogo} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}><label>Nombre:</label><input type="text" name="nombreDiseno" required style={{ width: '100%', padding: '12px', borderRadius: '8px' }} /></div>
                    <div style={{ flex: 2, minWidth: '250px' }}><label>Descripción (Opcional):</label><input type="text" name="descripcionDiseno" style={{ width: '100%', padding: '12px', borderRadius: '8px' }} /></div>
                    <div style={{ flex: 1, minWidth: '200px' }}><label>Foto:</label><input type="file" name="fotoNueva" accept="image/*" required style={{ width: '100%', padding: '10px' }} /></div>
                    <button type="submit" className="btn-submit" style={{ padding: '12px 25px', marginTop: '20px' }}>➕ Subir</button>
                  </form>
                </div>
                <div className="admin-tarjeta-blanca">
                  <div className="grid-catalogo">
                    {catalogo.map(modelo => (
                      <div key={modelo.id} className="tarjeta-modelo" style={{ position: 'relative' }}>
                        <button onClick={() => eliminarDelCatalogo(modelo.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>X</button>
                        <img src={modelo.imagen} alt={modelo.nombre} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                        <h3 style={{ marginBottom: '5px' }}>{modelo.nombre}</h3>
                        {modelo.descripcion && <p style={{ fontSize: '0.9rem', color: 'var(--taupe-brown)', padding: '0 15px 15px 15px', margin: '0', fontStyle: 'italic' }}>{modelo.descripcion}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {adminTab === 'insumos' && (
              <>
                <header className="admin-header"><h2>Gestor de Extras e Insumos</h2><div className="admin-perfil">👑 Admin: {usuarioActual.email.split('@')[0]}</div></header>
                <div className="admin-tarjeta-blanca" style={{ marginBottom: '30px' }}>
                  <form onSubmit={crearInsumo} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '200px' }}><label>Nombre del extra:</label><input type="text" name="nombreInsumo" required style={{ width: '100%', padding: '12px', borderRadius: '8px' }} /></div>
                    <div style={{ flex: 1, minWidth: '150px' }}><label>Precio (S/):</label><input type="number" name="precioInsumo" required style={{ width: '100%', padding: '12px', borderRadius: '8px' }} /></div>
                    <button type="submit" className="btn-submit" style={{ padding: '12px 25px' }}>➕ Guardar</button>
                  </form>
                </div>
                <div className="admin-tarjeta-blanca">
                  <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '15px'}}>
                    <thead>
                      <tr style={{borderBottom: '2px solid var(--cream-beige)'}}>
                        <th style={{padding: '15px'}}>ID</th><th style={{padding: '15px'}}>Nombre</th><th style={{padding: '15px'}}>Precio</th><th style={{padding: '15px', textAlign: 'center'}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insumosDisponibles.map(insumo => (
                        <tr key={insumo.id} style={{borderBottom: '1px solid var(--cream-beige)'}}>
                          <td style={{padding: '15px', fontWeight: 'bold'}}>#{insumo.id}</td><td style={{padding: '15px'}}>{insumo.nombre}</td><td style={{padding: '15px', color: 'var(--dusty-pink)', fontWeight: 'bold'}}>S/ {insumo.precio}</td>
                          <td style={{padding: '15px', textAlign: 'center'}}><button onClick={() => borrarInsumo(insumo.id)} style={{background: '#d9534f', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer'}}>🗑️ Borrar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </main>
        </div>
      )}

      {vista !== 'admin-panel' && (
        <footer style={{ marginTop: '50px', padding: '40px 20px', background: '#F9F1F0', textAlign: 'center', borderTop: '2px dashed var(--pastel-pink)', color: 'var(--taupe-brown)', borderRadius: '20px 20px 0 0' }}>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--dusty-pink)', fontSize: '1.5rem' }}>✨ Únete a la comunidad Stellar ✨</h3>
          <p style={{marginBottom: '20px', fontSize: '1rem'}}>¡Acompáñame en mi proceso y mira mis últimos trabajos!</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <a href={`https://instagram.com/${USUARIO_INSTAGRAM}`} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', padding: '12px 25px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              📸 Sígueme en Instagram
            </a>
            <a href={`https://wa.me/${NUMERO_WHATSAPP}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: 'white', padding: '12px 25px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              📱 Escríbeme al WhatsApp
            </a>
          </div>
          <p style={{ marginTop: '30px', fontSize: '0.85rem', color: '#888' }}>
            © 2026 Stellar Nails. Creado con mucha dedicación. | <span onClick={() => setVista('terminos')} style={{textDecoration: 'underline', cursor: 'pointer'}}>Términos y Condiciones</span>
          </p>
        </footer>
      )}

    </div>
  );
}

export default App;