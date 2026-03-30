const API = 'http://127.0.0.1:8000/api'
let categories = []
let accounts = []
let chartExpenses = null
let chartSummary = null
let sidebarCollapsed = false
let mobileSidebarOpen = false


// ─── AUTH ─────────────────────────────────────────────
function getToken() {
    return localStorage.getItem('fintrack-token')
}

function getUser() {
    const u = localStorage.getItem('fintrack-user')
    return u ? JSON.parse(u) : null
}

function logout() {
    localStorage.removeItem('fintrack-token')
    localStorage.removeItem('fintrack-user')
    window.location.href = '/login.html'
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    }
}

function checkAuth() {
    if (!getToken()) {
        window.location.href = '/login.html'
    }
}

// ─── TEMA ─────────────────────────────────────────────
function toggleTheme() {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    document.getElementById('theme-icon').textContent = next === 'dark' ? '◑' : '◐'
    updateChartTheme()
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
    document.getElementById('theme-icon').textContent = saved === 'dark' ? '◑' : '◐'
}

// ─── SIDEBAR ──────────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
        mobileSidebarOpen = !mobileSidebarOpen
        sidebar.classList.toggle('mobile-open', mobileSidebarOpen)
        overlay.classList.toggle('visible', mobileSidebarOpen)
    } else {
        sidebarCollapsed = !sidebarCollapsed
        sidebar.classList.toggle('collapsed', sidebarCollapsed)
        localStorage.setItem('sidebar-collapsed', sidebarCollapsed)
    }
}

function initSidebar() {
    const saved = localStorage.getItem('sidebar-collapsed') === 'true'
    if (saved && window.innerWidth > 768) {
        sidebarCollapsed = true
        document.getElementById('sidebar').classList.add('collapsed')
    }
}

// ─── NAVEGACIÓN ───────────────────────────────────────
function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'))
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
    const section = document.getElementById(name)
    section.classList.remove('hidden')
    void section.offsetWidth
    section.classList.add('animate-in')
    document.getElementById(`btn-${name}`).classList.add('active')
    if (name === 'home')         loadHome()
    if (name === 'dashboard')    loadDashboard()
    if (name === 'transactions') loadTransactions()
    if (name === 'categories')   loadCategories()
    if (name === 'profile') loadProfile()
    if (window.innerWidth <= 768 && mobileSidebarOpen) toggleSidebar()
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast')
    t.textContent = msg
    t.className = `toast ${type}`
    clearTimeout(t._timeout)
    t._timeout = setTimeout(() => t.classList.add('hidden'), 3000)
}

// ─── MODALES ──────────────────────────────────────────
async function openModal(id) {
    if (id === 'modal-transaction') {
        await loadAccounts()
        const accSelect = document.getElementById('tx-account')
        const hint = document.getElementById('tx-account-hint')
        accSelect.innerHTML = '<option value="">Seleccioná una cuenta</option>'
        if (accounts.length === 0) {
            hint.classList.remove('hidden')
        } else {
            hint.classList.add('hidden')
            accounts.forEach(a => {
                const opt = document.createElement('option')
                opt.value = a.id
                opt.textContent = `${a.name} — $${a.balance.toLocaleString('es-UY')}`
                accSelect.appendChild(opt)
            })
        }
    }
    document.getElementById(id).classList.remove('hidden')
    document.body.style.overflow = 'hidden'
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden')
    document.body.style.overflow = ''
    if (id === 'modal-transaction') resetTransactionForm()
    if (id === 'modal-category')    resetCategoryForm()
    if (id === 'modal-account')     resetAccountForm()
}

function resetTransactionForm() {
    document.getElementById('tx-id').value = ''
    document.getElementById('tx-type').value = ''
    document.getElementById('tx-amount').value = ''
    document.getElementById('tx-description').value = ''
    document.getElementById('tx-date').value = ''
    document.getElementById('tx-account').value = ''
    document.getElementById('tx-account-hint').classList.add('hidden')
    document.getElementById('tx-category').innerHTML = '<option value="">Primero seleccioná el tipo</option>'
    document.getElementById('tx-category-hint').classList.add('hidden')
    document.querySelector('#modal-transaction .modal-title').textContent = 'Nueva Transacción'
}

function resetCategoryForm() {
    document.getElementById('cat-id').value = ''
    document.getElementById('cat-name').value = ''
    document.getElementById('cat-type').value = 'expense'
    document.getElementById('cat-color').value = '#00c9a7'
    document.getElementById('cat-color-hex').value = '#00c9a7'
    document.querySelector('#modal-category .modal-title').textContent = 'Nueva Categoría'
}

function resetAccountForm() {
    document.getElementById('acc-id').value = ''
    document.getElementById('acc-name').value = ''
    document.getElementById('acc-type').value = 'cash'
    document.getElementById('acc-balance').value = ''
    document.getElementById('acc-color').value = '#7c6ff7'
    document.getElementById('acc-color-hex').value = '#7c6ff7'
    document.querySelector('#modal-account .modal-title').textContent = 'Nueva cuenta'
}

// ─── COLOR PICKERS ────────────────────────────────────
function syncColorHex(val) {
    document.getElementById('cat-color-hex').value = val
}
function syncColorPicker(val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val))
        document.getElementById('cat-color').value = val
}
function syncAccColorHex(val) {
    document.getElementById('acc-color-hex').value = val
}
function syncAccColorPicker(val) {
    if (/^#[0-9A-Fa-f]{6}$/.test(val))
        document.getElementById('acc-color').value = val
}

// ─── TIPO → CATEGORÍAS ────────────────────────────────
function onTxTypeChange() {
    const type = document.getElementById('tx-type').value
    const catSelect = document.getElementById('tx-category')
    const hint = document.getElementById('tx-category-hint')
    if (!type) {
        catSelect.innerHTML = '<option value="">Primero seleccioná el tipo</option>'
        return
    }
    hint.classList.add('hidden')
    const filtered = categories.filter(c => c.type === type)
    catSelect.innerHTML = '<option value="">Seleccioná una categoría</option>'
    filtered.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c.id
        opt.textContent = c.name
        catSelect.appendChild(opt)
    })
}

function checkTypeSelected() {
    const type = document.getElementById('tx-type').value
    if (!type) document.getElementById('tx-category-hint').classList.remove('hidden')
}

// ─── CUENTAS ──────────────────────────────────────────
async function loadAccounts() {
    try {
        const res = await fetch(`${API}/accounts/`)
        accounts = await res.json()
    } catch (e) {
        accounts = []
    }
}

async function saveAccount() {
    const id = document.getElementById('acc-id').value
    const name = document.getElementById('acc-name').value.trim()
    const type = document.getElementById('acc-type').value
    const initial_balance = parseFloat(document.getElementById('acc-balance').value)
    const hexInput = document.getElementById('acc-color-hex').value
    const color = /^#[0-9A-Fa-f]{6}$/.test(hexInput)
        ? hexInput
        : document.getElementById('acc-color').value

    if (!name) return showToast('El nombre es obligatorio', 'error')
    if (isNaN(initial_balance)) return showToast('Ingresá un saldo válido', 'error')

    const body = { name, type, initial_balance, color }
    const url = id ? `${API}/accounts/${id}` : `${API}/accounts/`
    const method = id ? 'PUT' : 'POST'

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    if (res.ok) {
        showToast(id ? 'Cuenta actualizada' : 'Cuenta creada')
        closeModal('modal-account')
        await loadHome()
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al guardar', 'error')
    }
}

async function editAccount(id) {
    await loadAccounts()
    const acc = accounts.find(a => a.id === id)
    if (!acc) return
    document.getElementById('acc-id').value = acc.id
    document.getElementById('acc-name').value = acc.name
    document.getElementById('acc-type').value = acc.type
    document.getElementById('acc-balance').value = acc.initial_balance
    document.getElementById('acc-color').value = acc.color
    document.getElementById('acc-color-hex').value = acc.color
    document.querySelector('#modal-account .modal-title').textContent = 'Editar cuenta'
    await openModal('modal-account')
}

async function deleteWallet(id) {
    if (!confirm('¿Eliminar esta billetera?')) return
    const res = await fetch(`${API}/accounts/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.ok) {
        showToast('Biletera eliminada')
        await loadHome()
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al eliminar', 'error')
    }
}

const accountTypeLabel = {
    cash: 'Efectivo', card: 'Débito', credit: 'Crédito', savings: 'Ahorro'
}

function renderAccounts() {
    const grid = document.getElementById('accounts-grid')
    if (accounts.length === 0) {
        grid.innerHTML = `<div style="color:var(--text-2);font-size:0.875rem;padding:0.5rem">
            No tenés cuentas. ¡Creá una!
        </div>`
        document.getElementById('home-total').textContent = '$0'
        return
    }
    const total = accounts.reduce((s, a) => s + a.balance, 0)
    document.getElementById('home-total').textContent = `$${total.toLocaleString('es-UY')}`
    grid.innerHTML = accounts.map(a => `
        <div class="account-card" style="--acc-color:${a.color}">
            <span class="account-type-badge">${accountTypeLabel[a.type] || a.type}</span>
            <span class="account-name">${a.name}</span>
            <span class="account-balance" style="color:${a.color}">
                $${a.balance.toLocaleString('es-UY')}
            </span>
            <div class="account-actions">
                <button class="btn-edit" onclick="editWallet(${a.id})">Editar</button>
                <button class="btn-danger" onclick="deleteWallet(${a.id})">Eliminar</button>
            </div>
        </div>
    `).join('')
}

// ─── HOME ─────────────────────────────────────────────
async function loadHome() {
    await loadAccounts()
    renderAccounts()

    try {
        const res = await fetch(`${API}/transactions/?limit=8`)
        const txs = await res.json()
        const list = document.getElementById('home-recent-list')

        if (txs.length === 0) {
            list.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-2);padding:2rem;font-size:0.875rem">
                Sin movimientos recientes
            </td></tr>`
            return
        }

        list.innerHTML = txs.map(t => {
            const date = new Date(t.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })
            const sign = t.type === 'income' ? '+' : '-'
            return `<tr>
                <td style="color:var(--text-2);font-size:0.8rem">${date}</td>
                <td>${t.description || '—'}</td>
                <td>
                    <span style="display:inline-flex;align-items:center;gap:0.4rem">
                        <span class="category-dot" style="background:${t.category.color}"></span>
                        ${t.category.name}
                    </span>
                </td>
                <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                <td class="amount-${t.type}">${sign}$${t.amount.toLocaleString('es-UY')}</td>
            </tr>`
        }).join('')
    } catch (e) {
        console.error('Error cargando transacciones recientes:', e)
    }
}

// ─── CATEGORÍAS ───────────────────────────────────────
async function loadCategories() {
    const res = await fetch(`${API}/categories/`)
    categories = await res.json()

    const list = document.getElementById('categories-list')
    if (categories.length === 0) {
        list.innerHTML = `<div style="color:var(--text-2);font-size:0.875rem;padding:0.5rem">
            No hay categorías. ¡Creá una!
        </div>`
        return
    }

    list.innerHTML = categories.map(c => `
        <div class="category-card">
            <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="category-dot" style="background:${c.color}"></span>
                <span class="category-name">${c.name}</span>
            </div>
            <span class="category-type">${c.type === 'income' ? '↑ Ingreso' : '↓ Gasto'}</span>
            <div class="category-actions">
                <button class="btn-edit" onclick="editCategory(${c.id})">Editar</button>
                <button class="btn-danger" onclick="deleteCategory(${c.id})">Eliminar</button>
            </div>
        </div>
    `).join('')

    updateFilterCategorySelect()
}

function filterCategories() {
    const type = document.getElementById('cat-filter-type').value
    const search = document.getElementById('cat-filter-search').value.toLowerCase()

    const filtered = categories.filter(c => {
        const matchType = !type || c.type === type
        const matchSearch = !search || c.name.toLowerCase().includes(search)
        return matchType && matchSearch
    })

    const list = document.getElementById('categories-list')
    if (filtered.length === 0) {
        list.innerHTML = `<div style="color:var(--text-2);font-size:0.875rem;padding:0.5rem">
            No se encontraron categorías
        </div>`
        return
    }

    list.innerHTML = filtered.map(c => `
        <div class="category-card">
            <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="category-dot" style="background:${c.color}"></span>
                <span class="category-name">${c.name}</span>
            </div>
            <span class="category-type">${c.type === 'income' ? '↑ Ingreso' : '↓ Gasto'}</span>
            <div class="category-actions">
                <button class="btn-edit" onclick="editCategory(${c.id})">Editar</button>
                <button class="btn-danger" onclick="deleteCategory(${c.id})">Eliminar</button>
            </div>
        </div>
    `).join('')
}

function updateFilterCategorySelect() {
    const el = document.getElementById('tx-filter-category')
    if (!el) return
    const current = el.value
    el.innerHTML = '<option value="">Todas las categorías</option>'
    categories.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c.id
        opt.textContent = c.name
        el.appendChild(opt)
    })
    if (current) el.value = current
}

async function saveCategory() {
    const id = document.getElementById('cat-id').value
    const hexInput = document.getElementById('cat-color-hex').value
    const color = /^#[0-9A-Fa-f]{6}$/.test(hexInput)
        ? hexInput
        : document.getElementById('cat-color').value
    const body = {
        name: document.getElementById('cat-name').value.trim(),
        type: document.getElementById('cat-type').value,
        color
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
    document.getElementById('cat-color-hex').value = cat.color
    document.querySelector('#modal-category .modal-title').textContent = 'Editar Categoría'
    openModal('modal-category')
}

async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return
    const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (res.ok) {
        showToast('Categoría eliminada')
        loadCategories()
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al eliminar', 'error')
    }
}

// ─── TRANSACCIONES ────────────────────────────────────
async function loadTransactions() {
    const type = document.getElementById('tx-filter-type').value
    const cat  = document.getElementById('tx-filter-category').value
    let url = `${API}/transactions/?limit=200`
    if (type) url += `&type=${type}`
    if (cat)  url += `&category_id=${cat}`

    const res = await fetch(url)
    const txs = await res.json()
    const list = document.getElementById('transactions-list')

    if (txs.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:var(--text-2);padding:2.5rem;font-size:0.875rem">
            Sin transacciones para mostrar
        </div>`
        return
    }

    list.innerHTML = txs.map(t => {
        const date = new Date(t.date).toLocaleDateString('es-UY', {
            day: '2-digit', month: 'short', year: 'numeric'
        })
        const sign = t.type === 'income' ? '+' : '-'
        const acc = accounts.find(a => a.id === t.account_id)
        const accLabel = acc ? `<span>·</span><span>${acc.name}</span>` : ''
        return `
        <div class="tx-item">
            <span class="tx-dot" style="background:${t.category.color}"></span>
            <div class="tx-info">
                <div class="tx-desc">${t.description || '—'}</div>
                <div class="tx-meta">
                    <span>${date}</span>
                    <span>·</span>
                    <span>${t.category.name}</span>
                    ${accLabel}
                    <span>·</span>
                    <span class="badge badge-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
                </div>
            </div>
            <span class="tx-amount amount-${t.type}">${sign}$${t.amount.toLocaleString('es-UY')}</span>
            <div class="tx-actions">
                <button class="btn-edit" onclick="editTransaction(${t.id})">Editar</button>
                <button class="btn-danger" onclick="deleteTransaction(${t.id})">Eliminar</button>
            </div>
        </div>`
    }).join('')
}

async function saveTransaction() {
    const id = document.getElementById('tx-id').value
    const type = document.getElementById('tx-type').value
    const amount = parseFloat(document.getElementById('tx-amount').value)
    const category_id = parseInt(document.getElementById('tx-category').value)
    const account_id = document.getElementById('tx-account').value

    if (!type)                  return showToast('Seleccioná el tipo de transacción', 'error')
    if (!account_id)            return showToast('Seleccioná una cuenta', 'error')
    if (!category_id)           return showToast('Seleccioná una categoría', 'error')
    if (!amount || amount <= 0) return showToast('Ingresá un monto válido', 'error')

    const dateVal = document.getElementById('tx-date').value
    const body = {
        type,
        amount,
        description: document.getElementById('tx-description').value.trim(),
        category_id,
        account_id: parseInt(account_id),
        date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()
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
        await loadAccounts()
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
    onTxTypeChange()

    document.getElementById('tx-amount').value = t.amount
    document.getElementById('tx-description').value = t.description || ''
    document.getElementById('tx-date').value = t.date.slice(0, 10)
    document.querySelector('#modal-transaction .modal-title').textContent = 'Editar Transacción'

    await openModal('modal-transaction')

    await new Promise(r => setTimeout(r, 50))
    document.getElementById('tx-category').value = t.category_id
    document.getElementById('tx-account').value = t.account_id || ''
}

async function deleteTransaction(id) {
    if (!confirm('¿Eliminar esta transacción?')) return
    const res = await fetch(`${API}/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
        showToast('Transacción eliminada')
        await loadAccounts()
        loadTransactions()
    } else {
        showToast('Error al eliminar', 'error')
    }
}

// ─── DASHBOARD ────────────────────────────────────────
async function loadDashboard() {
    const month = document.getElementById('filter-month').value
    const year  = document.getElementById('filter-year').value
    const res   = await fetch(`${API}/transactions/summary?month=${month}&year=${year}`)
    const data  = await res.json()

    document.getElementById('total-income').textContent  = `$${data.total_income.toLocaleString('es-UY')}`
    document.getElementById('total-expense').textContent = `$${data.total_expense.toLocaleString('es-UY')}`

    const balEl = document.getElementById('total-balance')
    balEl.textContent = `$${Math.abs(data.balance).toLocaleString('es-UY')}`
    balEl.style.color = data.balance >= 0 ? 'var(--income)' : 'var(--expense)'

    const max = Math.max(data.total_income, data.total_expense) || 1
    document.getElementById('income-bar').style.width  = `${(data.total_income / max) * 100}%`
    document.getElementById('expense-bar').style.width = `${(data.total_expense / max) * 100}%`

    renderCharts(data)
}

function getChartColors() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    return {
        text:    dark ? '#8888a4' : '#55556e',
        grid:    dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        income:  dark ? '#00c9a7' : '#00a88c',
        expense: dark ? '#ff6b6b' : '#e84545',
    }
}

function renderCharts(data) {
    const c = getChartColors()
    const expCats = Object.entries(data.by_category).filter(([, v]) => v.expense > 0)

    if (chartExpenses) chartExpenses.destroy()
    chartExpenses = expCats.length === 0 ? null : new Chart(document.getElementById('chart-expenses'), {
        type: 'doughnut',
        data: {
            labels: expCats.map(([n]) => n),
            datasets: [{
                data: expCats.map(([, v]) => v.expense),
                backgroundColor: expCats.map(([, v]) => v.color),
                borderWidth: 2,
                borderColor: 'transparent'
            }]
        },
        options: {
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: c.text, font: { size: 11 }, padding: 12, boxWidth: 10 }
                }
            }
        }
    })

    if (chartSummary) chartSummary.destroy()
    chartSummary = new Chart(document.getElementById('chart-summary'), {
        type: 'bar',
        data: {
            labels: ['Este mes'],
            datasets: [
                { label: 'Ingresos', data: [data.total_income],  backgroundColor: c.income,  borderRadius: 6, borderSkipped: false },
                { label: 'Gastos',   data: [data.total_expense], backgroundColor: c.expense, borderRadius: 6, borderSkipped: false }
            ]
        },
        options: {
            scales: {
                y: { ticks: { color: c.text, font: { size: 11 } }, grid: { color: c.grid } },
                x: { ticks: { color: c.text }, grid: { display: false } }
            },
            plugins: { legend: { labels: { color: c.text, font: { size: 11 }, boxWidth: 10 } } }
        }
    })
}

function updateChartTheme() {
    if (!document.getElementById('dashboard').classList.contains('hidden')) loadDashboard()
}

// ─── PERFIL ───────────────────────────────────────────
async function loadProfile() {
    const user = getUser()
    if (!user) return

    document.getElementById('profile-avatar').textContent = user.name.charAt(0).toUpperCase()
    document.getElementById('profile-name').textContent = user.name
    document.getElementById('profile-email').textContent = user.email
    document.getElementById('profile-since').textContent = `Miembro desde ${new Date(user.created_at).toLocaleDateString('es-UY', { year: 'numeric', month: 'long' })}`
    document.getElementById('edit-name').value = user.name
    document.getElementById('edit-email').value = user.email
}

async function saveProfile() {
    const name = document.getElementById('edit-name').value.trim()
    const email = document.getElementById('edit-email').value.trim()

    if (!name || !email) return showToast('Completá todos los campos', 'error')

    const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name, email })
    })

    if (res.ok) {
        const updated = await res.json()
        localStorage.setItem('fintrack-user', JSON.stringify(updated))
        showToast('Perfil actualizado')
        loadProfile()
        updateSidebarUser()
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al guardar', 'error')
    }
}

async function changePassword() {
    const current = document.getElementById('current-password').value
    const newPass = document.getElementById('new-password').value
    const confirm = document.getElementById('confirm-password').value

    if (!current || !newPass || !confirm) return showToast('Completá todos los campos', 'error')
    if (newPass !== confirm) return showToast('Las contraseñas no coinciden', 'error')
    if (newPass.length < 6) return showToast('Mínimo 6 caracteres', 'error')

    const res = await fetch(`${API}/auth/me/password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ current_password: current, new_password: newPass })
    })

    if (res.ok) {
        showToast('Contraseña actualizada')
        document.getElementById('current-password').value = ''
        document.getElementById('new-password').value = ''
        document.getElementById('confirm-password').value = ''
    } else {
        const err = await res.json()
        showToast(err.detail || 'Error al cambiar contraseña', 'error')
    }
}

async function deleteAccount() {
    if (!confirm('¿Estás seguro? Esta acción es irreversible y eliminará todos tus datos.')) return
    if (!confirm('Última confirmación — ¿eliminar cuenta definitivamente?')) return

    const res = await fetch(`${API}/auth/me`, {
        method: 'DELETE',
        headers: authHeaders()
    })

    if (res.ok) {
        showToast('Cuenta eliminada')
        logout()
    } else {
        showToast('Error al eliminar la cuenta', 'error')
    }
}

function updateSidebarUser() {
    const user = getUser()
    if (!user) return
    const nameEl = document.querySelector('.sidebar-user-name')
    const emailEl = document.querySelector('.sidebar-user-email')
    const avatarEl = document.querySelector('.sidebar-user-avatar')
    if (nameEl) nameEl.textContent = user.name
    if (emailEl) emailEl.textContent = user.email
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase()
}

// ─── INIT ─────────────────────────────────────────────
function init() {
    checkAuth()
    initTheme()
    initSidebar()

    const user = getUser()
    if (user) {
        const footer = document.querySelector('.sidebar-footer')
        footer.innerHTML = `
            <div style="padding:0.65rem 0.75rem;display:flex;flex-direction:column;gap:0.5rem">
                <div style="display:flex;align-items:center;gap:0.6rem;overflow:hidden">
                    <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-dim);
                        color:var(--accent);display:flex;align-items:center;justify-content:center;
                        font-size:0.75rem;font-weight:600;flex-shrink:0">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="nav-label" style="min-width:0">
                        <div style="font-size:0.85rem;font-weight:500;color:var(--text-1);
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                            ${user.name}
                        </div>
                        <div style="font-size:0.72rem;color:var(--text-2);
                            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                            ${user.email}
                        </div>
                    </div>
                </div>
                <div style="display:flex;gap:0.4rem">
                    <button class="theme-toggle" onclick="toggleTheme()" style="flex:1;padding:0.4rem">
                        <span id="theme-icon">◑</span>
                        <span class="nav-label">Tema</span>
                    </button>
                    <button onclick="logout()" style="background:transparent;border:1px solid var(--border);
                        color:var(--text-2);padding:0.4rem 0.6rem;border-radius:var(--radius-sm);
                        cursor:pointer;font-size:0.75rem;transition:all var(--transition)"
                        onmouseover="this.style.background='var(--expense-dim)';this.style.color='var(--expense)'"
                        onmouseout="this.style.background='transparent';this.style.color='var(--text-2)'">
                        Salir
                    </button>
                </div>
            </div>
        `
    }

    const now = new Date()
    const yearSelect = document.getElementById('filter-year')
    for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
        const opt = document.createElement('option')
        opt.value = y
        opt.textContent = y
        yearSelect.appendChild(opt)
    }
    document.getElementById('filter-month').value = now.getMonth() + 1

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && mobileSidebarOpen) {
            document.getElementById('sidebar').classList.remove('mobile-open')
            document.getElementById('sidebar-overlay').classList.remove('visible')
            mobileSidebarOpen = false
        }
    })

    loadCategories().then(() => loadHome())
}

