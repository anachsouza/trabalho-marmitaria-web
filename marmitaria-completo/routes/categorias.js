const express = require('express');
const { carregar, salvar, proximoId } = require('../db');
const { AppError, lerId } = require('../erros');

const router = express.Router();

// Valida o corpo da requisição (POST e PUT) e devolve os dados já limpos
function validar(corpo, db, idAtual) {
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';

    if (nome.length < 2) throw new AppError(400, 'O nome da categoria é obrigatório (mínimo de 2 caracteres).');
    if (nome.length > 50) throw new AppError(400, 'O nome da categoria deve ter no máximo 50 caracteres.');

    const duplicada = db.categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase() && c.id !== idAtual);
    if (duplicada) throw new AppError(409, `Já existe uma categoria chamada "${nome}".`);

    if (corpo.ativa !== undefined && typeof corpo.ativa !== 'boolean') {
        throw new AppError(400, 'O campo "ativa" deve ser verdadeiro ou falso.');
    }

    const imagem = typeof corpo.imagem === 'string' && corpo.imagem ? corpo.imagem : null;
    return { nome, imagem, ativa: corpo.ativa ?? true };
}

// LISTAR todas (com a quantidade de pratos de cada uma)
router.get('/', (req, res) => {
    const db = carregar();
    res.json(db.categorias.map(c => ({
        ...c,
        totalPratos: db.pratos.filter(p => p.categoriaId === c.id).length
    })));
});

// BUSCAR uma
router.get('/:id', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const categoria = db.categorias.find(c => c.id === id);
    if (!categoria) throw new AppError(404, `Categoria ${id} não encontrada.`);
    res.json(categoria);
});

// CRIAR
router.post('/', (req, res) => {
    const db = carregar();
    const dados = validar(req.body, db, null);
    const nova = { id: proximoId(db.categorias), ...dados };
    db.categorias.push(nova);
    salvar(db);
    res.status(201).json(nova);
});

// ATUALIZAR
router.put('/:id', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const indice = db.categorias.findIndex(c => c.id === id);
    if (indice === -1) throw new AppError(404, `Categoria ${id} não encontrada.`);

    const dados = validar(req.body, db, id);
    db.categorias[indice] = { id, ...dados };
    salvar(db);
    res.json(db.categorias[indice]);
});

// ATIVAR / OCULTAR (botão switch do index)
router.patch('/:id/status', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const categoria = db.categorias.find(c => c.id === id);
    if (!categoria) throw new AppError(404, `Categoria ${id} não encontrada.`);

    categoria.ativa = !categoria.ativa;
    salvar(db);
    res.json(categoria);
});

// EXCLUIR — BLOQUEADO se existir prato vinculado
router.delete('/:id', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const categoria = db.categorias.find(c => c.id === id);
    if (!categoria) throw new AppError(404, `Categoria ${id} não encontrada.`);

    const qtd = db.pratos.filter(p => p.categoriaId === id).length;
    if (qtd > 0) {
        throw new AppError(409,
            `Não é possível excluir a categoria "${categoria.nome}": ela possui ${qtd} prato(s) vinculado(s). ` +
            `Exclua os pratos primeiro.`);
    }

    db.categorias = db.categorias.filter(c => c.id !== id);
    salvar(db);
    res.json({ mensagem: `Categoria "${categoria.nome}" excluída com sucesso.` });
});

module.exports = router;
