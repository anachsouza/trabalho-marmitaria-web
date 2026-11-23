const form = document.getElementById('form-categoria');
const campoNome = document.getElementById('nome');
const campoImagem = document.getElementById('imagem');
const campoAtiva = document.getElementById('ativa');
const previa = document.getElementById('previa');

let imagemAtual = null;
const idEditar = new URLSearchParams(location.search).get('editar');

function mostrarPrevia(src) {
    previa.src = src;
    previa.style.display = 'block';
}

// modo edição: cadastro-categoria.html?editar=ID
(async () => {
    if (!idEditar) return;
    try {
        const c = await API.get(`/api/categorias/${idEditar}`);
        document.getElementById('titulo').textContent = 'Editar Categoria';
        campoNome.value = c.nome;
        campoAtiva.checked = c.ativa;
        imagemAtual = c.imagem;
        if (imagemAtual) mostrarPrevia(Util.src(imagemAtual, '../'));
    } catch (erro) {
        mostrarErro(erro);
    }
})();

campoImagem.addEventListener('change', async () => {
    const arquivo = campoImagem.files[0];
    if (!arquivo) return;
    try {
        imagemAtual = await Util.lerImagem(arquivo);
        mostrarPrevia(imagemAtual);
    } catch (erro) {
        mostrarErro(erro);
    }
});

form.addEventListener('submit', async e => {
    e.preventDefault();

    // Os dados vão crus para o servidor: quem valida é o back end
    const corpo = { nome: campoNome.value, imagem: imagemAtual, ativa: campoAtiva.checked };

    try {
        if (idEditar) await API.put(`/api/categorias/${idEditar}`, corpo);
        else await API.post('/api/categorias', corpo);
        location.href = '../index.html';
    } catch (erro) {
        mostrarErro(erro);
    }
});
