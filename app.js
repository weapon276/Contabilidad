// ============ VARIABLES GLOBALES ============
let deferredPrompt;
let installBanner = document.getElementById('installBanner');

let finanzasData = {
    ingresos: [],
    egresos: [],
    metas: [],
    inversiones: []
};

// ============ INSTALACIÓN PWA ============
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.style.display = 'block';
});

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

window.addEventListener('appinstalled', () => {
    console.log('App instalada exitosamente');
    if (installBanner) installBanner.style.display = 'none';
});

// ============ CARGA Y GUARDADO ============
function loadData() {
    const saved = localStorage.getItem('finanzasData');
    if (saved) {
        finanzasData = JSON.parse(saved);
        // Asegurar que exista el campo inversiones
        if (!finanzasData.inversiones) finanzasData.inversiones = [];
    }
    updateAllDisplays();
}

function saveData() {
    localStorage.setItem('finanzasData', JSON.stringify(finanzasData));
}

// ============ NAVEGACIÓN ============
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupConditionalFields();
    loadData();
});

function setupNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            showTab(tabName);
        });
    });
}

window.showTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const selected = document.getElementById(tabName);
    if (selected) selected.classList.add('active');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    updateAllDisplays();
};

// ============ CAMPOS CONDICIONALES ============
function setupConditionalFields() {
    const investmentType = document.getElementById('investmentType');
    if (investmentType) {
        investmentType.addEventListener('change', function() {
            const type = this.value;
            document.getElementById('fixedIncomeFields').classList.remove('show');
            document.getElementById('stockFields').classList.remove('show');
            
            if (type === 'nu' || type === 'cetes' || type === 'didi') {
                document.getElementById('fixedIncomeFields').classList.add('show');
            } else if (type === 'gbm' || type === 'fibras' || type === 'cripto') {
                document.getElementById('stockFields').classList.add('show');
            }
        });
    }
}

// ============ INGRESOS ============
document.getElementById('grossAmount')?.addEventListener('input', function() {
    const gross = parseFloat(this.value) || 0;
    const deductions = parseFloat(document.getElementById('deductions').value) || 0;
    document.getElementById('netAmount').value = (gross - deductions).toFixed(2);
});

document.getElementById('deductions')?.addEventListener('input', function() {
    const gross = parseFloat(document.getElementById('grossAmount').value) || 0;
    const deductions = parseFloat(this.value) || 0;
    document.getElementById('netAmount').value = (gross - deductions).toFixed(2);
});

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
});

function updateIncomeList() {
    const container = document.getElementById('incomeList');
    if (!container) return;
    if (finanzasData.ingresos.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay ingresos registrados</p>';
        return;
    }
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

window.deleteIncome = function(id) {
    if (confirm('¿Eliminar este ingreso?')) {
        finanzasData.ingresos = finanzasData.ingresos.filter(i => i.id !== id);
        saveData();
        updateIncomeList();
        updateAllDisplays();
    }
};

// ============ EGRESOS ============
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

function updateExpenseList() {
    const container = document.getElementById('expenseList');
    if (!container) return;
    if (finanzasData.egresos.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay gastos registrados</p>';
        return;
    }
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

window.deleteExpense = function(id) {
    if (confirm('¿Eliminar este gasto?')) {
        finanzasData.egresos = finanzasData.egresos.filter(e => e.id !== id);
        saveData();
        updateExpenseList();
        updateAllDisplays();
    }
};

// ============ CÁLCULOS ============
function calculateTotals() {
    const totalIngresos = finanzasData.ingresos.reduce((sum, i) => sum + i.montoNeto, 0);
    const totalGastos = finanzasData.egresos.reduce((sum, e) => sum + e.monto, 0);
    const ahorro = totalIngresos - totalGastos;
    const porcentajeAhorro = totalIngresos > 0 ? (ahorro / totalIngresos) * 100 : 0;
    return { totalIngresos, totalGastos, ahorro, porcentajeAhorro };
}

function calculateInvestmentTotals() {
    let totalInvertido = 0;
    let totalRendimiento = 0;
    let totalDividendos = 0;
    let totalValorActual = 0;
    
    finanzasData.inversiones.forEach(inv => {
        totalInvertido += inv.montoInvertido || 0;
        if (inv.rendimientoEstimado) totalRendimiento += inv.rendimientoEstimado;
        if (inv.dividendosAnuales) totalDividendos += inv.dividendosAnuales;
        if (inv.valorActual) totalValorActual += inv.valorActual;
    });
    
    return { totalInvertido, totalRendimiento, totalDividendos, totalValorActual };
}

// ============ CONSEJOS ============
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
    if (dashboardAdvice) dashboardAdvice.innerHTML = adviceHTML;
}

function checkBudgetRules() {
    const { totalIngresos, totalGastos } = calculateTotals();
    const gastosRecomendados = totalIngresos * 0.5;
    const advice = document.getElementById('dailyAdvice');
    if (advice) {
        if (totalGastos > gastosRecomendados) {
            const exceso = totalGastos - gastosRecomendados;
            advice.innerHTML = `⚠️ Alerta: Has excedido el presupuesto recomendado en $${exceso.toFixed(2)}. Revisa tus gastos variables y reduce gastos hormiga.`;
        } else {
            advice.innerHTML = `✅ Buen control financiero. Tus gastos están dentro del presupuesto recomendado.`;
        }
    }
}

// ============ INVERSIONES ============
document.getElementById('investmentForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const type = document.getElementById('investmentType').value;
    const name = document.getElementById('investmentName').value;
    const date = document.getElementById('investmentDate').value;
    const amount = parseFloat(document.getElementById('investedAmount').value);
    const notes = document.getElementById('investmentNotes').value;
    
    let investment = {
        id: Date.now(),
        fecha: date,
        tipo: type,
        nombre: name,
        montoInvertido: amount,
        notas: notes
    };
    
    // Campos para renta fija (Nu, CETES, Didi)
    if (type === 'nu' || type === 'cetes' || type === 'didi') {
        const interestRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const term = parseInt(document.getElementById('investmentTerm').value) || 0;
        investment.tasaInteres = interestRate;
        investment.plazoMeses = term;
        investment.tipoInversion = 'renta_fija';
        // Calcular rendimiento estimado
        investment.rendimientoEstimado = (amount * (interestRate / 100)) * (term / 12);
        investment.valorActual = amount + investment.rendimientoEstimado;
    }
    
    // Campos para acciones (GBM, FIBRAS, Cripto)
    if (type === 'gbm' || type === 'fibras' || type === 'cripto') {
        const ticker = document.getElementById('stockTicker').value || 'N/A';
        const stockType = document.getElementById('stockType').value || 'nacional';
        const buyPrice = parseFloat(document.getElementById('buyPrice').value) || 0;
        const shares = parseInt(document.getElementById('sharesCount').value) || 0;
        const currentPrice = parseFloat(document.getElementById('currentPrice').value) || buyPrice;
        const hasDividends = document.getElementById('generatesDividends').value === 'si';
        const dividendYield = parseFloat(document.getElementById('dividendYield').value) || 0;
        
        investment.ticker = ticker;
        investment.tipoAccion = stockType;
        investment.precioCompra = buyPrice;
        investment.numeroAcciones = shares;
        investment.precioActual = currentPrice;
        investment.generaDividendos = hasDividends;
        investment.rendimientoDividendo = dividendYield;
        investment.tipoInversion = 'renta_variable';
        
        // Calcular valor actual
        investment.valorActual = currentPrice * shares;
        // Calcular ganancia/pérdida
        investment.gananciaPerdida = (currentPrice - buyPrice) * shares;
        // Calcular dividendos anuales estimados
        if (hasDividends && dividendYield > 0) {
            investment.dividendosAnuales = (amount * (dividendYield / 100));
        } else {
            investment.dividendosAnuales = 0;
        }
    }
    
    finanzasData.inversiones.push(investment);
    saveData();
    updateInvestmentList();
    updateInvestmentSummary();
    this.reset();
    document.getElementById('fixedIncomeFields').classList.remove('show');
    document.getElementById('stockFields').classList.remove('show');
    alert('✅ Inversión registrada correctamente');
});

function updateInvestmentList() {
    const container = document.getElementById('investmentList');
    if (!container) return;
    if (finanzasData.inversiones.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay inversiones registradas</p>';
        return;
    }
    const inversionesOrdenadas = [...finanzasData.inversiones].reverse();
    container.innerHTML = inversionesOrdenadas.map(inv => {
        let detalles = '';
        if (inv.tipoInversion === 'renta_fija') {
            detalles = `
                📈 Tasa: ${inv.tasaInteres || 0}% anual<br>
                📅 Plazo: ${inv.plazoMeses || 0} meses<br>
                💰 Rendimiento estimado: $${(inv.rendimientoEstimado || 0).toFixed(2)}
            `;
        } else if (inv.tipoInversion === 'renta_variable') {
            const ganancia = inv.gananciaPerdida || 0;
            const badge = ganancia >= 0 ? 'profit-badge' : 'loss-badge';
            const label = ganancia >= 0 ? '💰 Ganancia' : '📉 Pérdida';
            detalles = `
                🏷️ Ticker: ${inv.ticker || 'N/A'}<br>
                💵 Compra: $${(inv.precioCompra || 0).toFixed(2)} | Actual: $${(inv.precioActual || 0).toFixed(2)}<br>
                📦 ${inv.numeroAcciones || 0} acciones<br>
                <span class="${badge}">${label}: $${ganancia.toFixed(2)}</span><br>
                ${inv.generaDividendos ? `💵 Dividendos anuales: $${(inv.dividendosAnuales || 0).toFixed(2)}` : '🔹 Sin dividendos'}
            `;
        }
        return `
            <div class="record-item">
                <strong>${inv.fecha}</strong> - ${inv.tipo.toUpperCase()}<br>
                📝 ${inv.nombre}<br>
                💰 Invertido: $${inv.montoInvertido.toFixed(2)}<br>
                ${detalles}
                ${inv.notas ? `📌 ${inv.notas}` : ''}
                <button onclick="deleteInvestment(${inv.id})" style="background:#e74c3c; padding:5px 10px; margin-top:5px;">Eliminar</button>
            </div>
        `;
    }).join('');
}

function updateInvestmentSummary() {
    const container = document.getElementById('investmentSummary');
    if (!container) return;
    const { totalInvertido, totalRendimiento, totalDividendos, totalValorActual } = calculateInvestmentTotals();
    
    container.innerHTML = `
        <div class="grid-3">
            <div style="background:#e8f5e9; padding:15px; border-radius:10px;">
                <h4>💰 Total Invertido</h4>
                <p style="font-size:24px; font-weight:bold; color:#2e7d32;">$${totalInvertido.toFixed(2)}</p>
            </div>
            <div style="background:#e3f2fd; padding:15px; border-radius:10px;">
                <h4>📈 Valor Actual</h4>
                <p style="font-size:24px; font-weight:bold; color:#1565c0;">$${totalValorActual.toFixed(2)}</p>
            </div>
            <div style="background:#fff3e0; padding:15px; border-radius:10px;">
                <h4>💵 Rendimiento</h4>
                <p style="font-size:24px; font-weight:bold; color:#e65100;">$${(totalValorActual - totalInvertido).toFixed(2)}</p>
            </div>
            <div style="background:#fce4ec; padding:15px; border-radius:10px;">
                <h4>💳 Dividendos Anuales</h4>
                <p style="font-size:24px; font-weight:bold; color:#c62828;">$${totalDividendos.toFixed(2)}</p>
            </div>
            <div style="background:#f3e5f5; padding:15px; border-radius:10px;">
                <h4>📊 Número de Inversiones</h4>
                <p style="font-size:24px; font-weight:bold; color:#6a1b9a;">${finanzasData.inversiones.length}</p>
            </div>
            <div style="background:#e8eaf6; padding:15px; border-radius:10px;">
                <h4>🏦 Rentabilidad %</h4>
                <p style="font-size:24px; font-weight:bold; color:#283593;">${totalInvertido > 0 ? ((totalValorActual - totalInvertido) / totalInvertido * 100).toFixed(1) : 0}%</p>
            </div>
        </div>
    `;
}

window.deleteInvestment = function(id) {
    if (confirm('¿Eliminar esta inversión?')) {
        finanzasData.inversiones = finanzasData.inversiones.filter(i => i.id !== id);
        saveData();
        updateInvestmentList();
        updateInvestmentSummary();
        updateAllDisplays();
    }
};

// ============ FONDO DE EMERGENCIA ============
function calculateEmergencyFund() {
    const { totalIngresos } = calculateTotals();
    // Calcular gastos mensuales promedio (últimos 3 meses)
    const gastosMensuales = {};
    finanzasData.egresos.forEach(g => {
        const mes = g.fecha.substring(0, 7);
        gastosMensuales[mes] = (gastosMensuales[mes] || 0) + g.monto;
    });
    const meses = Object.keys(gastosMensuales).sort();
    const ultimosMeses = meses.slice(-3);
    let gastoMensualPromedio = 0;
    if (ultimosMeses.length > 0) {
        const total = ultimosMeses.reduce((sum, m) => sum + gastosMensuales[m], 0);
        gastoMensualPromedio = total / ultimosMeses.length;
    } else {
        gastoMensualPromedio = totalIngresos * 0.7; // Estimación si no hay gastos
    }
    const fondoRecomendado = gastoMensualPromedio * 6; // 6 meses
    return { gastoMensualPromedio, fondoRecomendado };
}

function updateEmergencyFund() {
    const { gastoMensualPromedio, fondoRecomendado } = calculateEmergencyFund();
    const { ahorro } = calculateTotals();
    const ahorroDisponible = ahorro;
    const porcentajeCompletado = Math.min((ahorroDisponible / fondoRecomendado) * 100, 100);
    
    const container = document.getElementById('emergencyFundDisplay');
    if (container) {
        container.innerHTML = `
            <div class="emergency-fund">
                <p><strong>📊 Tu gasto mensual promedio:</strong> $${gastoMensualPromedio.toFixed(2)}</p>
                <p><strong>🛡️ Fondo recomendado (6 meses):</strong> $${fondoRecomendado.toFixed(2)}</p>
                <p><strong>💰 Ahorro disponible:</strong> $${ahorroDisponible.toFixed(2)}</p>
                <div style="background:#e0e0e0; border-radius:10px; height:20px; margin-top:10px; overflow:hidden;">
                    <div style="background:${porcentajeCompletado >= 100 ? '#4CAF50' : '#FF9800'}; height:100%; width:${porcentajeCompletado}%; transition: width 0.5s;"></div>
                </div>
                <p style="margin-top:5px;">${porcentajeCompletado >= 100 ? '✅ ¡Fondo de emergencia completo!' : `Progreso: ${porcentajeCompletado.toFixed(0)}% completado`}</p>
                ${porcentajeCompletado < 100 ? `<p style="color:#e65100; font-weight:bold;">⚠️ Antes de invertir, completa tu fondo de emergencia de 6 meses.</p>` : '<p style="color:#2e7d32; font-weight:bold;">✅ ¡Excelente! Ya tienes tu fondo de emergencia. Ahora puedes invertir con mayor seguridad.</p>'}
            </div>
        `;
    }
    
    // Consejo en la pestaña de consejos
    const adviceContainer = document.getElementById('emergencyAdvice');
    if (adviceContainer) {
        if (porcentajeCompletado < 100) {
            adviceContainer.innerHTML = `
                <div style="background:#ffebee; padding:15px; border-radius:10px; border-left:4px solid #e74c3c;">
                    <h4>⚠️ Fondo de Emergencia Incompleto</h4>
                    <p>Te falta <strong>$${(fondoRecomendado - ahorroDisponible).toFixed(2)}</strong> para completar tu fondo de 6 meses.</p>
                    <p>💡 <strong>Recomendación:</strong> Prioriza completar este fondo <strong>antes</strong> de realizar inversiones de riesgo.</p>
                    <p>📊 Destina el 20% de tus ingresos mensuales a completarlo.</p>
                </div>
            `;
        } else {
            adviceContainer.innerHTML = `
                <div style="background:#e8f5e9; padding:15px; border-radius:10px; border-left:4px solid #4CAF50;">
                    <h4>✅ Fondo de Emergencia Completado</h4>
                    <p>¡Excelente! Tienes ${porcentajeCompletado.toFixed(0)}% de tu fondo de emergencia.</p>
                    <p>💡 Ahora puedes considerar invertir el excedente en instrumentos como:</p>
                    <ul>
                        <li>📈 CETES (bajo riesgo)</li>
                        <li>🏦 Nu / FIBRAS (riesgo moderado)</li>
                        <li>📊 GBM+ (mayor riesgo, mayor rendimiento)</li>
                    </ul>
                </div>
            `;
        }
    }
}

// ============ METAS ============
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

function updateGoalsList() {
    const container = document.getElementById('activeGoals');
    if (!container) return;
    if (finanzasData.metas.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay metas activas</p>';
        return;
    }
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

window.deleteGoal = function(id) {
    if (confirm('¿Eliminar esta meta?')) {
        finanzasData.metas = finanzasData.metas.filter(m => m.id !== id);
        saveData();
        updateGoalsList();
    }
};

// ============ ANÁLISIS DE HÁBITOS ============
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

// ============ GRÁFICAS ============
function generateCharts() {
    // Gráfica de gastos
    const gastosPorCategoria = { fijo: 0, variable: 0, deduccion: 0, deuda: 0 };
    finanzasData.egresos.forEach(g => {
        if (gastosPorCategoria[g.categoria] !== undefined) gastosPorCategoria[g.categoria] += g.monto;
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
    
    // Gráfica de evolución mensual
    const gastosPorMes = {};
    const ingresosPorMes = {};
    finanzasData.egresos.forEach(g => {
        const mes = g.fecha.substring(0, 7);
        gastosPorMes[mes] = (gastosPorMes[mes] || 0) + g.monto;
    });
    finanzasData.ingresos.forEach(i => {
        const mes = i.fecha.substring(0, 7);
        ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + i.montoNeto;
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
    
    // Gráfica de inversiones
    const inversionesPorTipo = {};
    finanzasData.inversiones.forEach(inv => {
        inversionesPorTipo[inv.tipo] = (inversionesPorTipo[inv.tipo] || 0) + inv.montoInvertido;
    });
    const investContainer = document.getElementById('investmentsChart');
    if (investContainer && Object.keys(inversionesPorTipo).length > 0) {
        const colores = {
            nu: '#4CAF50',
            gbm: '#2196F3',
            cetes: '#FF9800',
            didi: '#9C27B0',
            fibras: '#F44336',
            cripto: '#E91E63',
            otro: '#607D8B'
        };
        Highcharts.chart('investmentsChart', {
            chart: { type: 'pie' },
            title: { text: 'Distribución de Inversiones' },
            series: [{
                name: 'Inversiones',
                data: Object.keys(inversionesPorTipo).map(key => ({
                    name: key.toUpperCase(),
                    y: inversionesPorTipo[key],
                    color: colores[key] || '#999'
                }))
            }]
        });
    }
}

// ============ ACTUALIZAR TODO ============
function updateAllDisplays() {
    updateSummary();
    updateIncomeList();
    updateExpenseList();
    updateInvestmentList();
    updateInvestmentSummary();
    updateGoalsList();
    updateHabitAnalysis();
    updateEmergencyFund();
    generateCharts();
    checkBudgetRules();
}

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

// ============ INICIALIZAR ============
loadData();

// ============ SERVICE WORKER ============
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('ServiceWorker registrado:', reg))
            .catch(err => console.log('Error al registrar ServiceWorker:', err));
    });
}
