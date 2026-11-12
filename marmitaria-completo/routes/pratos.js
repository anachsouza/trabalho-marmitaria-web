const express = require('express');
const { carregar, salvar, proximoId } = require('../db');
const { AppError, lerId } = require('../erros');

const router = express.Router();

// Valida o corpo da requisição (POST e PUT)
function validar(corpo, db, idAtual) {
    // categoria
    const categoriaId = Number(corpo.categoriaId);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
        throw new AppError(400, 'Selecione uma categoria para o prato.');
    }
    if (!db.categorias.some(c => c.id === categoriaId)) {
        throw new AppError(404, `A categoria ${categoriaId} não existe.`);
    }

    // nome
    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';
    if (nome.length < 2) throw new AppError(400, 'O nome do prato é obrigatório (mínimo de 2 caracteres).');
    if (nome.length > 80) throw new AppError(400, 'O nome do prato deve ter no máximo 80 caracteres.');

    const duplicado = db.pratos.some(p =>
        p.categoriaId === categoriaId && p.nome.toLowerCase() === nome.toLowerCase() && p.id !== idAtual);
    if (duplicado) throw new AppError(409, `Já existe um prato chamado "${nome}" nesta categoria.`);

    // preço — REGRA: não pode ser zero (nem negativo)
    if (corpo.preco === undefined || corpo.preco === null || String(corpo.preco).trim() === '') {
        throw new AppError(400, 'O preço do prato é obrigatório.');
    }
    const preco = typeof corpo.preco === 'string' ? Number(corpo.preco.replace(',', '.')) : corpo.preco;
    if (typeof preco !== 'number' || !Number.isFinite(preco)) {
        throw new AppError(400, 'Preço inválido: informe um número.');
    }
    if (preco <= 0) {
        throw new AppError(400, 'Preço inválido: o preço deve ser maior que zero (R$ 0,00 não é permitido).');
    }

    const descricao = typeof corpo.descricao === 'string' ? corpo.descricao.trim() : '';
    if (descricao.length > 300) throw new AppError(400, 'A descrição deve ter no máximo 300 caracteres.');

    if (corpo.disponivel !== undefined && typeof corpo.disponivel !== 'boolean') {
        throw new AppError(400, 'O campo "disponivel" deve ser verdadeiro ou falso.');
    }

    return {
        categoriaId,
        nome,
        descricao,
        preco: Math.round(preco * 100) / 100,
        disponivel: corpo.disponivel ?? true
    };
}

// LISTAR (opcional: ?categoriaId=1)
router.get('/', (req, res) => {
    const db = carregar();
    let pratos = db.pratos;
    if (req.query.categoriaId !== undefined) {
        const catId = lerId(req.query.categoriaId);
        pratos = pratos.filter(p => p.categoriaId === catId);
    }
    res.json(pratos);
});

// BUSCAR um
router.get('/:id', (req, res) => {
    const id = lerId(req.params.id);
    const prato = carregar().pratos.find(p => p.id === id);
    if (!prato) throw new AppError(404, `Prato ${id} não encontrado.`);
    res.json(prato);
});

// CRIAR
router.post('/', (req, res) => {
    const db = carregar();
    const dados = validar(req.body, db, null);
    const novo = { id: proximoId(db.pratos), ...dados };
    db.pratos.push(novo);
    salvar(db);
    res.status(201).json(novo);
});

// ATUALIZAR
router.put('/:id', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const indice = db.pratos.findIndex(p => p.id === id);
    if (indice === -1) throw new AppError(404, `Prato ${id} não encontrado.`);

    const dados = validar(req.body, db, id);
    db.pratos[indice] = { id, ...dados };
    salvar(db);
    res.json(db.pratos[indice]);
});

// DISPONÍVEL / INDISPONÍVEL
router.patch('/:id/disponibilidade', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const prato = db.pratos.find(p => p.id === id);
    if (!prato) throw new AppError(404, `Prato ${id} não encontrado.`);

    prato.disponivel = !prato.disponivel;
    salvar(db);
    res.json(prato);
});

// EXCLUIR
router.delete('/:id', (req, res) => {
    const id = lerId(req.params.id);
    const db = carregar();
    const prato = db.pratos.find(p => p.id === id);
    if (!prato) throw new AppError(404, `Prato ${id} não encontrado.`);

    db.pratos = db.pratos.filter(p => p.id !== id);
    salvar(db);
    res.json({ mensagem: `Prato "${prato.nome}" excluído com sucesso.` });
});

module.exports = router;
