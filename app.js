// Variables para instalación
let deferredPrompt;
let installBanner = document.getElementById('installBanner');

// Detectar si se puede instalar
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBanner) {
    installBanner.style.display = 'block';
  }
});

// Botón de instalación
const installBtn = document.getElementById('installBtn');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('App instalada');
        if (installBanner) installBanner.style.display = 'none';
      }
      deferredPrompt = null;
    }
  });
}

// Verificar si ya está instalada
window.addEventListener('appinstalled', () => {
  console.log('App instalada exitosamente');
  if (installBanner) installBanner.style.display = 'none';
});

// Inicialización de datos
let finanzasData = {
    ingresos: [],
    egresos: [],
    metas: []
};

// Cargar datos de localStorage
function loadData() {
    const saved = localStorage.getItem('finanzasData');
    if (saved) {
        finanzasData = JSON.parse(saved);
    }
    updateAllDisplays();
}

// Guardar datos
function saveData() {
    localStorage.setItem('finanzasData', JSON.stringify(finanzasData));
}

// Mostrar pestañas
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateAllDisplays();
}

// Calcular neto
document.getElementById('grossAmount')?.addEventListener('input', function() {
    const gross = parseFloat(this.value) || 0;
    const deductions = parseFloat(document.getElementById('deductions').value) || 0;
    const net = gross - deductions;
    document.getElementById('netAmount').value = net.toFixed(2);
});

document.getElementById('deductions')?.addEventListener('input', function() {
    const gross = parseFloat(document.getElementById('grossAmount').value) || 0;
    const deductions = parseFloat(this.value) || 0;
    const net = gross - deductions;
    document.getElementById('netAmount').value = net.toFixed(2);
});

// Registrar ingreso
document.getElementById('incomeForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const ingreso = {
        id: Date.now(),
        fecha: document.getElementById('incomeDate').value,
        tipo: document.getElementById('incomeType').value,
        montoBruto: parseFloat(document.getElementById('grossAmount').value),
        retenciones: parseFloat(document.getElementById('deductions').value),
        montoNeto: parseFloat(document.getElementById('netAmount').value)
    };
    
    finanzasData.ingresos.push(ingreso);
    saveData();
    updateIncomeList();
    showAdviceForIncome(ingreso.montoNeto);
    this.reset();
    
    // Mostrar consejo automático
    alert(`💡 Consejo financiero:\nDe tus $${ingreso.montoNeto.toFixed(2)}:\n• $${(ingreso.montoNeto * 0.5).toFixed(2)} para Gastos Fijos\n• $${(ingreso.montoNeto * 0.3).toFixed(2)} para Gastos Personales\n• $${(ingreso.montoNeto * 0.2).toFixed(2)} para Inversión/Ahorro`);
});

// Mostrar consejo al registrar ingreso
function showAdviceForIncome(amount) {
    const advice = {
        necesidades: amount * 0.5,
        deseos: amount * 0.3,
        inversion: amount * 0.2
    };
    
    const adviceHTML = `
        <div class="advice-card" style="margin-top: 10px;">
            <h4>🎯 Distribución recomendada de este ingreso:</h4>
            <p>💰 50% Necesidades: <strong>$${advice.necesidades.toFixed(2)}</strong></p>
            <p>🎮 30% Deseos personales: <strong>$${advice.deseos.toFixed(2)}</strong></p>
            <p>📈 20% Inversión/Ahorro: <strong>$${advice.inversion.toFixed(2)}</strong></p>
        </div>
    `;
    
    const dashboardAdvice = document.getElementById('dashboardAdvice');
    if (dashboardAdvice) {
        dashboardAdvice.innerHTML = adviceHTML;
    }
}

// Registrar gasto
document.getElementById('expenseForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const gasto = {
        id: Date.now(),
        fecha: document.getElementById('expenseDate').value,
        categoria: document.getElementById('expenseCategory').value,
        descripcion: document.getElementById('expenseDesc').value,
        monto: parseFloat(document.getElementById('expenseAmount').value)
    };
    
    finanzasData.egresos.push(gasto);
    saveData();
    updateExpenseList();
    checkBudgetRules();
    this.reset();
});

// Actualizar lista de ingresos
function updateIncomeList() {
    const container = document.getElementById('incomeList');
    if (!container) return;
    
    const ingresosOrdenados = [...finanzasData.ingresos].reverse();
    container.innerHTML = ingresosOrdenados.map(ingreso => `
        <div class="record-item">
            <strong>${ingreso.fecha}</strong> - ${ingreso.tipo}<br>
            💵 Bruto: $${ingreso.montoBruto.toFixed(2)}<br>
            📉 Neto: $${ingreso.montoNeto.toFixed(2)}<br>
            <button onclick="deleteIncome(${ingreso.id})" style="background:#e74c3c; padding:5px 10px; margin-top:5px;">Eliminar</button>
        </div>
    `).join('');
}

// Actualizar lista de gastos
function updateExpenseList() {
    const container = document.getElementById('expenseList');
    if (!container) return;
    
    const egresosOrdenados = [...finanzasData.egresos].reverse();
    container.innerHTML = egresosOrdenados.map(gasto => `
        <div class="record-item">
            <strong>${gasto.fecha}</strong> - ${gasto.categoria}<br>
            📝 ${gasto.descripcion}<br>
            💸 $${gasto.monto.toFixed(2)}<br>
            <button onclick="deleteExpense(${gasto.id})" style="background:#e74c3c; padding:5px 10px; margin-top:5px;">Eliminar</button>
        </div>
    `).join('');
}

// Eliminar ingreso
function deleteIncome(id) {
    if (confirm('¿Eliminar este ingreso?')) {
        finanzasData.ingresos = finanzasData.ingresos.filter(i => i.id !== id);
        saveData();
        updateIncomeList();
        updateAllDisplays();
    }
}

// Eliminar gasto
function deleteExpense(id) {
    if (confirm('¿Eliminar este gasto?')) {
        finanzasData.egresos = finanzasData.egresos.filter(e => e.id !== id);
        saveData();
        updateExpenseList();
        updateAllDisplays();
    }
}

// Calcular totales
function calculateTotals() {
    const totalIngresos = finanzasData.ingresos.reduce((sum, i) => sum + i.montoNeto, 0);
    const totalGastos = finanzasData.egresos.reduce((sum, e) => sum + e.monto, 0);
    const ahorro = totalIngresos - totalGastos;
    const porcentajeAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;
    
    return { totalIngresos, totalGastos, ahorro, porcentajeAhorro };
}

// Actualizar resumen
function updateSummary() {
    const { totalIngresos, totalGastos, ahorro, porcentajeAhorro } = calculateTotals();
    const summaryDiv = document.getElementById('summaryStats');
    if (summaryDiv) {
        summaryDiv.innerHTML = `
            <div class="grid-2">
                <div style="background:#e8f5e9; padding:15px; border-radius:10px;">
                    <h4>💰 Total Ingresos</h4>
                    <p style="font-size:24px; font-weight:bold; color:#2e7d32;">$${totalIngresos.toFixed(2)}</p>
                </div>
                <div style="background:#ffebee; padding:15px; border-radius:10px;">
                    <h4>💸 Total Gastos</h4>
                    <p style="font-size:24px; font-weight:bold; color:#c62828;">$${totalGastos.toFixed(2)}</p>
                </div>
                <div style="background:#e3f2fd; padding:15px; border-radius:10px;">
                    <h4>📈 Ahorro Neto</h4>
                    <p style="font-size:24px; font-weight:bold; color:#1565c0;">$${ahorro.toFixed(2)}</p>
                </div>
                <div style="background:#fff3e0; padding:15px; border-radius:10px;">
                    <h4>🎯 % Ahorro</h4>
                    <p style="font-size:24px; font-weight:bold; color:#e65100;">${porcentajeAhorro.toFixed(1)}%</p>
                </div>
            </div>
        `;
    }
}

// Verificar reglas presupuestales
function checkBudgetRules() {
    const { totalIngresos, totalGastos } = calculateTotals();
    const gastosRecomendados = totalIngresos * 0.5;
    
    if (totalGastos > gastosRecomendados) {
        const exceso = totalGastos - gastosRecomendados;
        const advice = document.getElementById('dailyAdvice');
        if (advice) {
            advice.innerHTML = `⚠️ Alerta: Has excedido el presupuesto recomendado en $${exceso.toFixed(2)}. Revisa tus gastos variables y reduce gastos hormiga.`;
        }
    }
}

// Generar gráficas
function generateCharts() {
    const gastosPorCategoria = {
        fijo: 0,
        variable: 0,
        deduccion: 0,
        deuda: 0
    };
    
    finanzasData.egresos.forEach(gasto => {
        if (gastosPorCategoria[gasto.categoria] !== undefined) {
            gastosPorCategoria[gasto.categoria] += gasto.monto;
        }
    });
    
    const chartContainer = document.getElementById('expensesChart');
    if (chartContainer && Object.values(gastosPorCategoria).some(v => v > 0)) {
        Highcharts.chart('expensesChart', {
            chart: { type: 'pie' },
            title: { text: 'Distribución de Gastos' },
            series: [{
                name: 'Gastos',
                data: [
                    { name: 'Gastos Fijos', y: gastosPorCategoria.fijo, color: '#667eea' },
                    { name: 'Gastos Variables', y: gastosPorCategoria.variable, color: '#764ba2' },
                    { name: 'Deducciones', y: gastosPorCategoria.deduccion, color: '#f093fb' },
                    { name: 'Deudas', y: gastosPorCategoria.deuda, color: '#f5576c' }
                ]
            }]
        });
    }
    
    const gastosPorMes = {};
    const ingresosPorMes = {};
    
    finanzasData.egresos.forEach(gasto => {
        const mes = gasto.fecha.substring(0, 7);
        gastosPorMes[mes] = (gastosPorMes[mes] || 0) + gasto.monto;
    });
    
    finanzasData.ingresos.forEach(ingreso => {
        const mes = ingreso.fecha.substring(0, 7);
        ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + ingreso.montoNeto;
    });
    
    const meses = [...new Set([...Object.keys(gastosPorMes), ...Object.keys(ingresosPorMes)])].sort();
    
    const trendsContainer = document.getElementById('trendsChart');
    if (trendsContainer && meses.length > 0) {
        Highcharts.chart('trendsChart', {
            chart: { type: 'line' },
            title: { text: 'Evolución Mensual' },
            xAxis: { categories: meses },
            series: [
                { name: 'Ingresos', data: meses.map(m => ingresosPorMes[m] || 0), color: '#2e7d32' },
                { name: 'Gastos', data: meses.map(m => gastosPorMes[m] || 0), color: '#c62828' }
            ]
        });
    }
}

// Planificador de metas
document.getElementById('goalForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const goalName = document.getElementById('goalName').value;
    const goalCost = parseFloat(document.getElementById('goalCost').value);
    const goalYears = parseFloat(document.getElementById('goalYears').value);
    const monthlySavings = parseFloat(document.getElementById('monthlySavings').value);
    
    const monthsNeeded = goalCost / monthlySavings;
    const yearsNeeded = monthsNeeded / 12;
    
    const resultDiv = document.getElementById('goalResult');
    resultDiv.style.display = 'block';
    
    if (yearsNeeded <= goalYears) {
        resultDiv.innerHTML = `
            <h3>✅ ¡Meta Alcanzable!</h3>
            <p>🎯 ${goalName}</p>
            <p>💰 Costo: $${goalCost.toFixed(2)}</p>
            <p>⏱️ Ahorrando $${monthlySavings.toFixed(2)} mensuales</p>
            <p>📅 Tiempo necesario: ${yearsNeeded.toFixed(1)} años</p>
            <p>🎉 ¡Cumplirás tu meta antes de lo planeado!</p>
            <button onclick="saveGoal()" style="margin-top:10px;">💾 Guardar esta meta</button>
        `;
    } else {
        const neededMonthly = goalCost / (goalYears * 12);
        resultDiv.innerHTML = `
            <h3>⚠️ Meta Desafiante</h3>
            <p>🎯 ${goalName}</p>
            <p>💰 Costo: $${goalCost.toFixed(2)}</p>
            <p>⏱️ Plazo: ${goalYears} años</p>
            <p>💪 Necesitas ahorrar $${neededMonthly.toFixed(2)} mensuales</p>
            <p>📊 Propuesta: Reduce gastos variables en $${(neededMonthly - monthlySavings).toFixed(2)} mensuales</p>
            <button onclick="saveGoal()" style="margin-top:10px;">💾 Guardar esta meta</button>
        `;
    }
    
    window.currentGoal = { goalName, goalCost, goalYears, monthlySavings };
});

// Guardar meta
function saveGoal() {
    if (window.currentGoal) {
        finanzasData.metas.push({
            id: Date.now(),
            ...window.currentGoal,
            fecha: new Date().toISOString()
        });
        saveData();
        updateGoalsList();
        alert('Meta guardada exitosamente');
    }
}

// Actualizar lista de metas
function updateGoalsList() {
    const container = document.getElementById('activeGoals');
    if (!container) return;
    
    container.innerHTML = finanzasData.metas.map(meta => `
        <div class="record-item">
            <strong>🎯 ${meta.goalName}</strong><br>
            💰 Costo: $${meta.goalCost.toFixed(2)}<br>
            ⏱️ Plazo: ${meta.goalYears} años<br>
            💵 Ahorro mensual: $${meta.monthlySavings.toFixed(2)}<br>
            <button onclick="deleteGoal(${meta.id})" style="background:#e74c3c; padding:5px 10px; margin-top:5px;">Eliminar</button>
        </div>
    `).join('');
}

// Eliminar meta
function deleteGoal(id) {
    if (confirm('¿Eliminar esta meta?')) {
        finanzasData.metas = finanzasData.metas.filter(m => m.id !== id);
        saveData();
        updateGoalsList();
    }
}

// Análisis de hábitos
function updateHabitAnalysis() {
    const container = document.getElementById('habitAnalysis');
    if (!container) return;
    
    const gastosVariables = finanzasData.egresos
        .filter(g => g.categoria === 'variable')
        .reduce((sum, g) => sum + g.monto, 0);
    
    const { totalIngresos } = calculateTotals();
    const porcentajeGastosVariables = totalIngresos > 0 ? (gastosVariables / totalIngresos) * 100 : 0;
    
    if (porcentajeGastosVariables > 30) {
        container.innerHTML = `
            <div style="background:#ffebee; padding:15px; border-radius:10px;">
                <h4>⚠️ Gastos variables elevados (${porcentajeGastosVariables.toFixed(1)}%)</h4>
                <p>Recomendación: Reduce en ${(porcentajeGastosVariables - 30).toFixed(1)}% tus gastos discrecionales.</p>
                <p>💡 Podrías ahorrar $${(gastosVariables * 0.2).toFixed(2)} mensuales reduciendo gastos hormiga.</p>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="background:#e8f5e9; padding:15px; border-radius:10px;">
                <h4>✅ Excelente control de gastos variables</h4>
                <p>Tus gastos variables representan solo el ${porcentajeGastosVariables.toFixed(1)}% de tus ingresos.</p>
                <p>🎉 ¡Sigue así! Destina el excedente a inversión.</p>
            </div>
        `;
    }
}

// Actualizar todos los displays
function updateAllDisplays() {
    updateSummary();
    updateIncomeList();
    updateExpenseList();
    updateGoalsList();
    updateHabitAnalysis();
    generateCharts();
    checkBudgetRules();
}

// Inicializar
loadData();

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado exitosamente:', registration);
            })
            .catch(error => {
                console.log('Error al registrar ServiceWorker:', error);
            });
    });
}
