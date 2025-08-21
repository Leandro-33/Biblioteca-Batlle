// Función de búsqueda mejorada para Biblioteca de Batlle

function normaliza(txt) {
    if (!txt) return "";
    return txt
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quita acentos
        .replace(/[^\w\s]/gi, "") // quita caracteres raros
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function showAutoAlertWithAdd(msg, ms = 2500) {
    const el = document.getElementById('autoAlert');
    el.innerHTML = `${msg}
        <button class="btn btn-primary" style="padding:5px 10px; font-size: 12px; margin-left: 12px;"
            onclick="openAddBookFromSearch(); hideAutoAlert();">Agregar libro</button>`;
    el.style.display = 'block';
    clearTimeout(window._autoAlertTimeout);
    window._autoAlertTimeout = setTimeout(() => { el.style.display = 'none'; }, ms);
}

function hideAutoAlert() {
    const el = document.getElementById('autoAlert');
    el.style.display = 'none';
}

function searchBooks() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let term = normaliza(searchInput.value);
    searchTerm = term;

    if (!term) {
        filteredBooks = [];
        hideAutoAlert();
        renderTable();
        return;
    }

    filteredBooks = books.filter(book => (
        normaliza(book.apellido).includes(term) ||
        normaliza(book.nombre).includes(term) ||
        normaliza(book.titulo).includes(term)
    ));

    if (filteredBooks.length === 0) {
        showAutoAlertWithAdd('📚 Sin resultados.', 8000);
    } else {
        hideAutoAlert();
    }
    renderTable(filteredBooks);
}

// Cierra la alerta al escribir otra búsqueda
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', hideAutoAlert);
    }
});
function importData() {
    const file = document.getElementById('importFile').files[0];
    if (!file) {
        showAutoAlert("No se seleccionó archivo.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            // Carga directa sin análisis ni validaciones
            books = jsonData;
            saveBooks();
            updateStats();
            renderTable();
            showAutoAlert('📥 Planilla cargada automáticamente');
        } catch (error) {
            console.error('Error al importar datos:', error);
            showAutoAlert('Error al importar datos. Verifica el archivo y vuelve a intentar.', 4000);
        }
    };
    reader.readAsArrayBuffer(file);
}