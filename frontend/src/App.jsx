import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

const API_URL = "https://u-itas.onrender.com";

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
    axios.get(`${API_URL}/api/citas/`).then(r => {
      const citasOrdenadas = r.data.sort((a, b) => b.id - a.id);
      setTodasLasCitas(citasOrdenadas);
    }).catch(console.error);
  };

  const cargarCatalogo = () => axios.get(`${API_URL}/api/catalogo/`).then(r => setCatalogo(r.data)).catch(console.error);
  const cargarInsumos = () => axios.get(`${API_URL}/api/insumos/`).then(r => setInsumosDisponibles(r.data)).catch(console.error);

  useEffect(() => { 
    cargarCatalogo(); 
    cargarInsumos(); 
    cargarTodasLasCitas(); 
  }, []);

  const cargarMisCitas = () => {
    axios.get(`${API_URL}/api/citas/`).then(response => {
        const citasCliente = response.data.filter(cita => cita.cliente === usuarioActual?.id);
        setMisCitas(citasCliente.sort((a, b) => b.id - a.id));
        setVista('mis-citas');
    }).catch(console.error);
  };

  const manejarAuth = async (e) => {
    e.preventDefault();
    const endpoint = modoAuth === 'login' ? 'login' : 'registro';
    try {
      const respuesta = await axios.post(`${API_URL}/api/${endpoint}/`, { 
        username: e.target.email.value, 
        email: e.target.email.value, 
        password: e.target.password.value 
      });
      
      setUsuarioActual(respuesta.data);
      cargarTodasLasCitas(); 
      if (respuesta.data.email === CORREO_JEFA) {
        toast.success(`¡Bienvenida a tu panel de control!`, { icon: '👑' });
        setVista('admin-panel');
        setAdminTab('dashboard'); 
      } else {
        toast.success(`¡Bienvenida a Stellar!`);
        setVista('agendar');
      }
    } catch (error) {
      const mensajeError = error.response?.data?.error || 'Error de conexión';
      toast.error(mensajeError);
    }
  };

  const verificarChoqueDeHora = (fechaStr, duracionMin = 120, idExcluido = null) => {
    const fechaSegura1 = fechaStr.length === 16 ? `${fechaStr}:00` : fechaStr;
    const inicio1 = new Date(fechaSegura1);
    if (isNaN(inicio1.getTime())) return false; 
    const fin1 = new Date(inicio1.getTime() + duracionMin * 60000);

    return todasLasCitas.some(c => {
      if (c.id === idExcluido || c.estado === 'cancelada' || !c.fecha_hora) return false;
      const inicio2 = new Date(c.fecha_hora.slice(0, 16) + ":00");
      const fin2 = new Date(inicio2.getTime() + (c.duracion_estimada || 120) * 60000);
      return (inicio1 < fin2 && inicio2 < fin1);
    });
  };

  const manejarEnvioCita = async (e) => {
    e.preventDefault();
    if (!horaElegida) return toast.error('Selecciona una hora');

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

    const toastId = toast.loading('Enviando...');
    try {
      await axios.post(`${API_URL}/api/citas/`, formData);
      toast.dismiss(toastId);
      toast.success('¡Cita agendada!');
      setCitaEnviada(true);
      cargarTodasLasCitas(); 
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al enviar');
    }
  };

  const cancelarCitaClienta = async (citaId) => {
    if(!window.confirm("¿Confirmas la cancelación? No hay reembolso de abono.")) return;
    try {
      await axios.post(`${API_URL}/api/citas/${citaId}/cancelar/`, { cancelado_por: 'cliente' });
      toast.success('Cancelada');
      cargarMisCitas(); cargarTodasLasCitas();
    } catch (e) { toast.error('Error'); }
  };

  const cancelarCitaAdmin = async () => {
    if(!window.confirm("¿Cancelar cita?")) return;
    try {
      await axios.post(`${API_URL}/api/citas/${citaSeleccionada.id}/cancelar/`, { cancelado_por: 'admin' });
      toast.success('Cancelada');
      setCitaSeleccionada(null); cargarTodasLasCitas();
    } catch (e) { toast.error('Error'); }
  };

  const restaurarCitaDirecta = async (citaId) => {
    try {
      await axios.post(`${API_URL}/api/citas/${citaId}/restaurar/`);
      toast.success('Restaurada');
      cargarTodasLasCitas();
    } catch (e) { toast.error('Error'); }
  };

  const abrirEvaluacion = async (cita) => {
    setCitaSeleccionada(cita);
    setRecomendacionAdmin(cita.recomendacion_admin || ""); 
    setFechaHoraAdmin(formatoFechaInput(cita.fecha_hora)); 
    setSistemaAdmin(cita.sistema_unas || ""); 
    setDuracionAdmin(cita.duracion_estimada || 120);
    setDetallesCalculadora(cita.desglose_cotizacion || []);
    setPrecioBase(parseFloat(cita.precio_base) || 0);
    try {
      const res = await axios.get(`${API_URL}/api/clientes/${cita.cliente}/perfil/`);
      setInfoClienta(res.data);
    } catch (e) { setInfoClienta(null); }
  };

  const enviarCotizacion = async () => {
    if (verificarChoqueDeHora(fechaHoraAdmin, parseInt(duracionAdmin), citaSeleccionada.id)) return toast.error('Choque de horario');
    try {
      await axios.post(`${API_URL}/api/citas/${citaSeleccionada.id}/cotizar//`, { 
        precio_base: precioBase, detalles: detallesCalculadora, recomendacion: recomendacionAdmin,
        fecha_hora: fechaHoraAdmin, sistema_unas: sistemaAdmin, duracion_estimada: parseInt(duracionAdmin)
      });
      toast.success('Enviada');
      setCitaSeleccionada(null); cargarTodasLasCitas();
    } catch (e) { toast.error('Error'); }
  };

  const confirmarCitaDirecta = async (citaId) => {
    try { await axios.post(`${API_URL}/api/citas/${citaId}/confirmar_final/`); toast.success('Confirmada'); cargarTodasLasCitas(); } catch (e) { toast.error('Error'); }
  };

  const cerrarSesion = () => { setUsuarioActual(null); setVista('inicio'); };

  return (
    <div className="salon-container">
      <Toaster position="top-center" />

      {vista !== 'admin-panel' && (
        <header className="header-principal" style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <img src="/verde.png" alt="Logo" style={{ height: '200px', borderRadius: '50%', marginBottom: '10px' }} />
          <h1>Stellar</h1>
          <p>Expertos en estructura y diseño premium.</p>
          <nav className="navegacion">
            <button onClick={() => setVista('inicio')} className="btn-nav">Catálogo</button>
            {!usuarioActual ? (
              <button onClick={() => setVista('login')} className="btn-agendar">Iniciar Sesión</button>
            ) : (
              <>
                <button onClick={() => setVista('agendar')} className="btn-agendar">Agendar Cita</button>
                <button onClick={cargarMisCitas} className="btn-nav">Mis Citas</button>
                <button onClick={cerrarSesion} className="btn-nav">Salir</button>
              </>
            )}
          </nav>
        </header>
      )}

      {vista === 'inicio' && (
        <section className="seccion-catalogo">
          <h2>Inspírate en Stellar</h2>
          <div className="grid-catalogo">
            {catalogo.map(modelo => (
              <div key={modelo.id} className="tarjeta-modelo">
                <img src={modelo.imagen} alt={modelo.nombre} style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
                <h3>{modelo.nombre}</h3>
                <p>{modelo.descripcion}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ... Resto de las vistas (Login, Agendar, Admin) ... */}
      {/* (El resto del código se mantiene igual pero usando las funciones corregidas arriba) */}
      
      {vista === 'login' && (
        <section className="seccion-formulario">
          <form onSubmit={manejarAuth} className="formulario">
            <h2>{modoAuth === 'login' ? 'Bienvenida' : 'Registro'}</h2>
            <input type="email" name="email" placeholder="Correo" required />
            <input type="password" name="password" placeholder="Contraseña" required />
            <button type="submit" className="btn-submit">Entrar</button>
          </form>
        </section>
      )}

      {vista === 'admin-panel' && (
        <div className="admin-layout">
           <main className="admin-content" style={{padding: '20px'}}>
              <h2>Panel de Control 👑</h2>
              <button onClick={() => setVista('inicio')} className="btn-nav">Volver a la Web</button>
              {/* Aquí iría tu tabla de solicitudes que ya tenías */}
              <div className="admin-tarjeta-blanca">
                  <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                      <tr><th>ID</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr>
                    </thead>
                    <tbody>
                      {todasLasCitas.map(cita => (
                        <tr key={cita.id}>
                          <td>#{cita.id}</td>
                          <td>{mostrarFechaBonita(cita.fecha_hora)}</td>
                          <td>{cita.estado_display}</td>
                          <td>
                            <button onClick={() => abrirEvaluacion(cita)}>Ver</button>
                            {cita.estado === 'cancelada' && cita.cancelado_por === 'admin' && (
                              <button onClick={() => restaurarCitaDirecta(cita.id)}>Deshacer</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
           </main>
        </div>
      )}

      <footer style={{ textAlign: 'center', padding: '20px' }}>
        <p>© 2026 Stellar Nails | <span onClick={() => setVista('terminos')} style={{cursor:'pointer', textDecoration:'underline'}}>Términos</span></p>
      </footer>
    </div>
  );
}

export default App;