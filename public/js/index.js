const secao = document.querySelector('.lista-categorias');

async function renderizarIndex() {
    try {
        const [categorias, metricas] = await Promise.all([
            API.get('/api/categorias'),
            API.get('/api/metricas')
        ]);

        document.getElementById('metrica-total-categorias').textContent = metricas.totalCategorias;
        document.getElementById('metrica-categorias-ativas').textContent = metricas.categoriasAtivas;
        document.getElementById('metrica-categorias-ocultas').textContent = metricas.categoriasOcultas;
        document.getElementById('metrica-total-pratos').textContent = metricas.totalPratos;

        secao.querySelectorAll('.cartao-categoria, .vazio').forEach(el => el.remove());

        if (categorias.length === 0) {
            secao.insertAdjacentHTML('beforeend', '<p class="vazio">Nenhuma categoria cadastrada.</p>');
            return;
        }

        categorias.forEach(c => {
            const qtd = c.totalPratos;
            secao.insertAdjacentHTML('beforeend', `
            <div class="cartao-categoria" data-id="${c.id}">
                <img src="${Util.src(c.imagem, './')}" alt="Foto ${Util.esc(c.nome)}">
                <div class="detalhes-categoria">
                    <h4>${Util.esc(c.nome)}</h4>
                    <p><span class="contador-pratos">${qtd}</span> ${qtd === 1 ? 'prato cadastrado' : 'pratos cadastrados'}</p>
                </div>
                <div class="status ${c.ativa ? 'ativa' : 'oculta'}">
                    <span class="${c.ativa ? 'bolinha-verde' : 'bolinha-cinza'}"></span> ${c.ativa ? 'Ativa' : 'Oculta'}
                </div>
                <div class="acoes">
                    <a href="./pages/lista-pratos.html?categoria=${c.id}" class="btn-secundario">Ver pratos</a>
                    <button class="btn-excluir">
                        <img src="./assets/icons/icone-lixeira.svg" alt="Excluir" class="icone-lixeira">
                    </button>
                    <button class="btn-switch ${c.ativa ? 'on' : ''}"></button>
                </div>
            </div>`);
        });
    } catch (erro) {
        mostrarErro(erro);
    }
}

secao.addEventListener('click', async e => {
    const card = e.target.closest('.cartao-categoria');
    if (!card) return;
    const id = card.dataset.id;
    const nome = card.querySelector('h4').textContent;

    try {
        if (e.target.closest('.btn-switch')) {
            await API.patch(`/api/categorias/${id}/status`);
            await renderizarIndex();
        } else if (e.target.closest('.btn-excluir')) {
            if (!confirm(`Excluir a categoria "${nome}"?`)) return;
            await API.delete(`/api/categorias/${id}`);   // o servidor bloqueia se houver pratos
            await renderizarIndex();
        }
    } catch (erro) {
        mostrarErro(erro);
    }
});

renderizarIndex();
