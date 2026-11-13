const catId = new URLSearchParams(location.search).get('categoria');
const lista = document.getElementById('lista');

async function renderizar() {
    try {
        if (catId) {
            const categoria = await API.get(`/api/categorias/${catId}`);
            document.getElementById('titulo').textContent = `Pratos — ${categoria.nome}`;
            document.getElementById('btn-novo').href = `./cadastro-pratos.html?categoria=${categoria.id}`;
        }

        const pratos = await API.get(catId ? `/api/pratos?categoriaId=${catId}` : '/api/pratos');
        document.getElementById('subtitulo').textContent =
            `${pratos.length} ${pratos.length === 1 ? 'prato cadastrado' : 'pratos cadastrados'}`;

        if (pratos.length === 0) {
            lista.innerHTML = '<p class="vazio">Nenhum prato cadastrado ainda.</p>';
            return;
        }

        lista.innerHTML = pratos.map(p => `
            <div class="cartao-categoria" data-id="${p.id}">
                <div class="detalhes-categoria">
                    <h4>${Util.esc(p.nome)}</h4>
                    <p>${Util.esc(p.descricao) || 'Sem descrição'}</p>
                    <p class="preco-prato">${Util.moeda(p.preco)}</p>
                </div>
                <div class="status ${p.disponivel ? 'ativa' : 'oculta'}">
                    <span class="${p.disponivel ? 'bolinha-verde' : 'bolinha-cinza'}"></span>
                    ${p.disponivel ? 'Disponível' : 'Indisponível'}
                </div>
                <div class="acoes">
                    <a href="./cadastro-pratos.html?editar=${p.id}" class="btn-secundario">Editar</a>
                    <button class="btn-excluir">
                        <img src="../assets/icons/icone-lixeira.svg" alt="Excluir" class="icone-lixeira">
                    </button>
                    <button class="btn-switch ${p.disponivel ? 'on' : ''}"></button>
                </div>
            </div>`).join('');
    } catch (erro) {
        lista.innerHTML = '';
        mostrarErro(erro);
    }
}

lista.addEventListener('click', async e => {
    const card = e.target.closest('.cartao-categoria');
    if (!card) return;
    const id = card.dataset.id;
    const nome = card.querySelector('h4').textContent;

    try {
        if (e.target.closest('.btn-switch')) {
            await API.patch(`/api/pratos/${id}/disponibilidade`);
            await renderizar();
        } else if (e.target.closest('.btn-excluir')) {
            if (!confirm(`Excluir o prato "${nome}"?`)) return;
            await API.delete(`/api/pratos/${id}`);
            await renderizar();
        }
    } catch (erro) {
        mostrarErro(erro);
    }
});

renderizar();
