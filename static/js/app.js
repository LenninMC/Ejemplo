// Elementos del DOM
const sensorValor = document.getElementById('sensor-valor');
const sensorBar = document.getElementById('sensor-bar');
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
    1: 'FRÍO (683-1023)',
    2: 'CALIENTE (342-682)',
    3: 'MUY CALIENTE (0-341)'
};

const accionesMotor = {
    1: 'Motor APAGADO',
    2: 'Motor a VELOCIDAD MEDIA (170/255)',
    3: 'Motor a VELOCIDAD MÁXIMA (255/255)'
};

// Límites de zonas
const LIMITE_ZONA_1 = 683;
const LIMITE_ZONA_2 = 342;

// Configuración de la gráfica
const ctx = document.getElementById('mainChart').getContext('2d');
let chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Sensor KY-028',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: true
            },
            {
                label: 'Límite Zona 1-2 (683)',
                data: [],
                borderColor: '#ffaa00',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                type: 'line'
            },
            {
                label: 'Límite Zona 2-3 (342)',
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
                        if (label === 'Sensor KY-028') {
                            let estado = '';
                            if (value >= LIMITE_ZONA_1) estado = ' (FRÍO)';
                            else if (value >= LIMITE_ZONA_2) estado = ' (CALIENTE)';
                            else estado = ' (MUY CALIENTE)';
                            return label + ': ' + value + estado;
                        }
                        return label + ': ' + value;
                    }
                }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 1023,
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#8d9db0', stepSize: 200 },
                title: { display: true, text: 'Valor sensor (0-1023)', color: '#8d9db0' }
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

function updateChart(valor) {
    const ahora = new Date().toLocaleTimeString();
    
    chart.data.labels.push(ahora);
    chart.data.datasets[0].data.push(valor);
    chart.data.datasets[1].data.push(LIMITE_ZONA_1);  // Límite 683
    chart.data.datasets[2].data.push(LIMITE_ZONA_2);  // Límite 342
    
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
            // Actualizar sensor
            sensorValor.textContent = j.sensor;
            const porcentaje = (j.sensor / 1023) * 100;
            sensorBar.style.width = `${porcentaje}%`;
            
            // Actualizar motor
            velocidadValor.textContent = j.velocidad;
            const porcentajeVel = (j.velocidad / 255) * 100;
            motorBar.style.width = `${porcentajeVel}%`;
            
            // Actualizar zona activa
            actualizarZonas(j.zona);
            
            // Actualizar gráfica
            updateChart(j.sensor);
            
            // Actualizar timestamp
            const ahora = new Date();
            ultimaActualizacion.textContent = `${ahora.toLocaleDateString()} ${ahora.toLocaleTimeString()}`;
            
            console.log(`Sensor: ${j.sensor}, Zona: ${j.zona}, Velocidad: ${j.velocidad}`);
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
