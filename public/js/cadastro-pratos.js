const params = new URLSearchParams(location.search);
const form = document.getElementById('form-prato');
const selectCat = document.getElementById('categoria');
const idEditar = params.get('editar');

function atualizarLinks() {
    const url = `./lista-pratos.html?categoria=${selectCat.value}`;
    document.getElementById('link-voltar').href = url;
    document.getElementById('link-cancelar').href = url;
}
selectCat.addEventListener('change', atualizarLinks);

(async () => {
    try {
        const categorias = await API.get('/api/categorias');
        selectCat.innerHTML = categorias.map(c => `<option value="${c.id}">${Util.esc(c.nome)}</option>`).join('');

        if (idEditar) {
            const p = await API.get(`/api/pratos/${idEditar}`);
            document.getElementById('titulo').textContent = 'Editar Prato';
            selectCat.value = p.categoriaId;
            document.getElementById('nome').value = p.nome;
            document.getElementById('descricao').value = p.descricao;
            document.getElementById('preco').value = p.preco;
            document.getElementById('disponivel').checked = p.disponivel;
        } else if (params.get('categoria')) {
            selectCat.value = params.get('categoria');
        }
        atualizarLinks();
    } catch (erro) {
        mostrarErro(erro);
    }
})();

form.addEventListener('submit', async e => {
    e.preventDefault();

    // Os dados vão crus para o servidor: preço zerado, nome vazio etc. são barrados pelo back end
    const corpo = {
        categoriaId: selectCat.value,
        nome: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value,
        preco: document.getElementById('preco').value,
        disponivel: document.getElementById('disponivel').checked
    };

    try {
        if (idEditar) await API.put(`/api/pratos/${idEditar}`, corpo);
        else await API.post('/api/pratos', corpo);
        location.href = `./lista-pratos.html?categoria=${corpo.categoriaId}`;
    } catch (erro) {
        mostrarErro(erro);
    }
});
