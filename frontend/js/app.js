const API = 'http://127.0.0.1:8000/api'
let categories = []
let chartExpenses = null
let chartSummary = null

// ─── NAVEGACIÓN ───────────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'))
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    document.getElementById(name).classList.remove('hidden')
    document.getElementById(`btn-${name}`).classList.add('active')

    if (name === 'dashboard') loadDashboard()
    if (name === 'transactions') loadTransactions()
    if (name === 'categories') loadCategories()
}

// ─── TOAST ────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.className = `toast ${type}`
    setTimeout(() => t.classList.add('hidden'), 3000)
}

// ─── MODALES ──────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.remove('hidden')
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden')
    if (id === 'modal-transaction') resetTransactionForm()
    if (id === 'modal-category') resetCategoryForm()
}

function resetTransactionForm() {
    document.getElementById('tx-id').value = ''
    document.getElementById('tx-type').value = 'income'
    document.getElementById('tx-amount').value = ''
    document.getElementById('tx-description').value = ''
    document.getElementById('tx-date').value = ''
}

function resetCategoryForm() {
    document.getElementById('cat-id').value = ''
    document.getElementById('cat-name').value = ''
    document.getElementById('cat-type').value = 'expense'
    document.getElementById('cat-color').value = '#6366f1'
}

// ─── CATEGORÍAS ───────────────────────────────────────────
async function loadCategories() {
    const res = await fetch(`${API}/categories/`)
    categories = await res.json()

    const list = document.getElementById('categories-list')
    list.innerHTML = categories.map(c => `
        <div class="category-card">
            <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="category-dot" style="background:${c.color}"></span>
                <span class="category-name">${c.name}</span>
            </div>
            <span class="category-type">${c.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
            <div class="category-actions">
                <button class="btn-edit" onclick="editCategory(${c.id})">Editar</button>
                <button class="btn-danger" onclick="deleteCategory(${c.id})">Eliminar</button>
            </div>
        </div>
    `).join('')

    const selects = ['tx-category', 'tx-filter-category']
    selects.forEach(id => {
        const el = document.getElementById(id)
        if (!el) return
        const current = el.value
        el.innerHTML = id === 'tx-filter-category'
            ? '<option value="">Todas las categorías</option>'
            : ''
        categories.forEach(c => {
            const opt = document.createElement('option')
            opt.value = c.id
            opt.textContent = c.name
            el.appendChild(opt)
        })
        if (current) el.value = current
    })
}

async function saveCategory() {
    const id = document.getElementById('cat-id').value
    const body = {
        name: document.getElementById('cat-name').value,
        type: document.getElementById('cat-type').value,
        color: document.getElementById('cat-color').value
    }

    if (!body.name) return showToast('El nombre es obligatorio', 'error')

    const url = id ? `${API}/categories/${id}` : `${API}/categories/`
    const method = id ? 'PUT' : 'POST'

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (res.ok) {
        showToast(id ? 'Categoría actualizada' : 'Categoría creada')
        closeModal('modal-category')
        loadCategories()
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al guardar', 'error')
    }
}

async function editCategory(id) {
    const cat = categories.find(c => c.id === id)
    if (!cat) return
    document.getElementById('cat-id').value = cat.id
    document.getElementById('cat-name').value = cat.name
    document.getElementById('cat-type').value = cat.type
    document.getElementById('cat-color').value = cat.color
    document.querySelector('#modal-category .modal-header h2').textContent = 'Editar Categoría'
    openModal('modal-category')
}

async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return
    const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
        showToast('Categoría eliminada')
        loadCategories()
    } else {
        showToast('Error al eliminar', 'error')
    }
}

// ─── TRANSACCIONES ────────────────────────────────────────
async function loadTransactions() {
    const type = document.getElementById('tx-filter-type').value
    const cat = document.getElementById('tx-filter-category').value
    let url = `${API}/transactions/?limit=200`
    if (type) url += `&type=${type}`
    if (cat) url += `&category_id=${cat}`

    const res = await fetch(url)
    const txs = await res.json()

    const list = document.getElementById('transactions-list')
    if (txs.length === 0) {
        list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem">Sin transacciones</td></tr>`
        return
    }

    list.innerHTML = txs.map(t => {
        const date = new Date(t.date).toLocaleDateString('es-UY')
        const sign = t.type === 'income' ? '+' : '-'
        return `
        <tr>
            <td>${date}</td>
            <td>${t.description || '—'}</td>
            <td>
                <span style="display:inline-flex;align-items:center;gap:0.4rem">
                    <span class="category-dot" style="background:${t.category.color}"></span>
                    ${t.category.name}
                </span>
            </td>
            <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
            <td class="amount-${t.type}">${sign}$${t.amount.toLocaleString('es-UY')}</td>
            <td>
                <button class="btn-edit" onclick="editTransaction(${t.id})">Editar</button>
                <button class="btn-danger" onclick="deleteTransaction(${t.id})">Eliminar</button>
            </td>
        </tr>`
    }).join('')
}

async function saveTransaction() {
    const id = document.getElementById('tx-id').value
    const amount = parseFloat(document.getElementById('tx-amount').value)
    const category_id = parseInt(document.getElementById('tx-category').value)

    if (!amount || amount <= 0) return showToast('Ingresá un monto válido', 'error')
    if (!category_id) return showToast('Seleccioná una categoría', 'error')

    const body = {
        type: document.getElementById('tx-type').value,
        amount,
        description: document.getElementById('tx-description').value,
        category_id,
        date: document.getElementById('tx-date').value || new Date().toISOString()
    }

    const url = id ? `${API}/transactions/${id}` : `${API}/transactions/`
    const method = id ? 'PUT' : 'POST'

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (res.ok) {
        showToast(id ? 'Transacción actualizada' : 'Transacción creada')
        closeModal('modal-transaction')
        loadTransactions()
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al guardar', 'error')
    }
}

async function editTransaction(id) {
    const res = await fetch(`${API}/transactions/${id}`)
    const t = await res.json()
    document.getElementById('tx-id').value = t.id
    document.getElementById('tx-type').value = t.type
    document.getElementById('tx-amount').value = t.amount
    document.getElementById('tx-description').value = t.description || ''
    document.getElementById('tx-category').value = t.category_id
    document.getElementById('tx-date').value = t.date.slice(0, 16)
    document.querySelector('#modal-transaction .modal-header h2').textContent = 'Editar Transacción'
    openModal('modal-transaction')
}

async function deleteTransaction(id) {
    if (!confirm('¿Eliminar esta transacción?')) return
    const res = await fetch(`${API}/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
        showToast('Transacción eliminada')
        loadTransactions()
    } else {
        showToast('Error al eliminar', 'error')
    }
}

// ─── DASHBOARD ────────────────────────────────────────────
async function loadDashboard() {
    const month = document.getElementById('filter-month').value
    const year = document.getElementById('filter-year').value
    const res = await fetch(`${API}/transactions/summary?month=${month}&year=${year}`)
    const data = await res.json()

    document.getElementById('total-income').textContent = `$${data.total_income.toLocaleString('es-UY')}`
    document.getElementById('total-expense').textContent = `$${data.total_expense.toLocaleString('es-UY')}`
    const balance = document.getElementById('total-balance')
    balance.textContent = `$${data.balance.toLocaleString('es-UY')}`
    balance.style.color = data.balance >= 0 ? '#22c55e' : '#ef4444'

    renderCharts(data)
}

function renderCharts(data) {
    const expenseCategories = Object.entries(data.by_category)
        .filter(([, v]) => v.expense > 0)

    if (chartExpenses) chartExpenses.destroy()
    chartExpenses = new Chart(document.getElementById('chart-expenses'), {
        type: 'doughnut',
        data: {
            labels: expenseCategories.map(([name]) => name),
            datasets: [{
                data: expenseCategories.map(([, v]) => v.expense),
                backgroundColor: expenseCategories.map(([, v]) => v.color),
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } }
        }
    })

    if (chartSummary) chartSummary.destroy()
    chartSummary = new Chart(document.getElementById('chart-summary'), {
        type: 'bar',
        data: {
            labels: ['Este mes'],
            datasets: [
                { label: 'Ingresos', data: [data.total_income], backgroundColor: '#22c55e' },
                { label: 'Gastos', data: [data.total_expense], backgroundColor: '#ef4444' }
            ]
        },
        options: {
            scales: {
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
            },
            plugins: { legend: { labels: { color: '#94a3b8' } } }
        }
    })
}

// ─── INIT ─────────────────────────────────────────────────
function init() {
    const now = new Date()
    const yearSelect = document.getElementById('filter-year')
    for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
        const opt = document.createElement('option')
        opt.value = y
        opt.textContent = y
        yearSelect.appendChild(opt)
    }
    document.getElementById('filter-month').value = now.getMonth() + 1

    loadCategories().then(() => loadDashboard())
}

init()
