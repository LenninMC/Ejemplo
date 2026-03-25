// Elementos del DOM
const tempValor = document.getElementById('temp-valor');
const tempBar = document.getElementById('temp-bar');
const velocidadValor = document.getElementById('velocidad-valor');
const motorBar = document.getElementById('motor-bar');
const zonaActiva = document.getElementById('zona-activa');
const accionMotor = document.getElementById('accion-motor');
const zonas = {
    1: document.getElementById('zona-1'),
    2: document.getElementById('zona-2'),
    3: document.getElementById('zona-3')
};
const ultimaActualizacion = document.getElementById('ultima-actualizacion');

// Nombres y acciones
const nombresZonas = {
    1: 'Temperatura Baja (< 20°C)',
    2: 'Temperatura Media (20°C - 35°C)',
    3: 'Temperatura Alta (> 35°C)'
};

const accionesMotor = {
    1: 'Motor APAGADO (sin refrigeración)',
    2: 'Motor a VELOCIDAD MEDIA (refrigeración moderada)',
    3: 'Motor a VELOCIDAD MÁXIMA (refrigeración intensiva)'
};

// Límites de temperatura
const LIMITE_ZONA_1 = 20;   // 20°C
const LIMITE_ZONA_2 = 35;   // 35°C

// Configuración de la gráfica
const ctx = document.getElementById('mainChart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Temperatura (°C)',
                data: [],
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: true
            },
            {
                label: 'Límite Zona 1-2 (20°C)',
                data: [],
                borderColor: '#ffaa00',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                type: 'line'
            },
            {
                label: 'Límite Zona 2-3 (35°C)',
                data: [],
                borderColor: '#ffaa00',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                type: 'line'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { 
                mode: 'index', 
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        let value = context.raw;
                        if (label === 'Temperatura (°C)') {
                            let estado = '';
                            if (value <= LIMITE_ZONA_1) estado = ' (Baja)';
                            else if (value <= LIMITE_ZONA_2) estado = ' (Media)';
                            else estado = ' (Alta)';
                            return label + ': ' + value + '°C' + estado;
                        }
                        return label + ': ' + value + '°C';
                    }
                }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 50,
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#8d9db0', stepSize: 10 },
                title: { display: true, text: 'Temperatura (°C)', color: '#8d9db0' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#8d9db0', maxRotation: 45, minRotation: 45 }
            }
        }
    }
});

function actualizarZonas(zona) {
    // Limpiar todas
    Object.values(zonas).forEach(z => {
        if (z) z.classList.remove('active');
    });
    
    // Activar la zona actual
    if (zonas[zona]) zonas[zona].classList.add('active');
    
    // Actualizar texto de zona activa
    zonaActiva.textContent = nombresZonas[zona] || '---';
    accionMotor.textContent = accionesMotor[zona] || '---';
}

function updateChart(temperatura) {
    const ahora = new Date().toLocaleTimeString();
    
    chart.data.labels.push(ahora);
    chart.data.datasets[0].data.push(temperatura);
    chart.data.datasets[1].data.push(LIMITE_ZONA_1);  // Límite Zona 1-2 (20°C)
    chart.data.datasets[2].data.push(LIMITE_ZONA_2);  // Límite Zona 2-3 (35°C)
    
    // Mantener últimos 30 puntos
    if (chart.data.labels.length > 30) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
        chart.data.datasets[2].data.shift();
    }
    
    chart.update();
}

async function fetchEstado() {
    try {
        const r = await fetch("/api/estado");
        const j = await r.json();
        
        if (j.ok) {
            // Actualizar sensor de temperatura
            tempValor.textContent = j.temperatura.toFixed(1);
            const porcentajeTemp = (j.temperatura / 100) * 100;
            tempBar.style.width = `${Math.min(100, porcentajeTemp)}%`;
            
            // Actualizar motor
            velocidadValor.textContent = j.velocidad;
            const porcentajeVel = (j.velocidad / 255) * 100;
            motorBar.style.width = `${porcentajeVel}%`;
            
            // Actualizar zona activa
            actualizarZonas(j.zona);
            
            // Actualizar gráfica
            updateChart(j.temperatura);
            
            // Actualizar timestamp
            const ahora = new Date();
            ultimaActualizacion.textContent = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
            
            console.log(`Temperatura: ${j.temperatura}°C, Zona: ${j.zona}, Velocidad: ${j.velocidad}`);
        } else {
            console.error('Error en datos:', j.error);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
    }
}

// Iniciar polling cada segundo
setInterval(fetchEstado, 1000);
fetchEstado();
