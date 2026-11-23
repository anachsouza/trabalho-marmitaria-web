
const express = require('express');
const { supabase } = require('../supabase');
const { AppError, lerId } = require('../erros');

const router = express.Router();

// Encaminha erros das rotas assíncronas
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Busca um prato pelo ID
async function buscarPrato(id) {
    const { data, error } = await supabase
        .from('pratos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new AppError(404, `Prato ${id} não encontrado.`);

    return data;
}

// Valida os dados do prato
async function validar(corpo, idAtual, imagemAtual = '') {
    const categoriaId = Number(corpo.categoriaId);

    if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
        throw new AppError(400, 'Selecione uma categoria para o prato.');
    }

    const { data: categoria, error: erroCategoria } = await supabase
        .from('categorias')
        .select('id')
        .eq('id', categoriaId)
        .maybeSingle();

    if (erroCategoria) throw erroCategoria;
    if (!categoria) throw new AppError(404, `A categoria ${categoriaId} não existe.`);

    const nome = typeof corpo.nome === 'string' ? corpo.nome.trim() : '';

    if (nome.length < 2) throw new AppError(400, 'O nome do prato é obrigatório (mínimo de 2 caracteres).');
    if (nome.length > 80) throw new AppError(400, 'O nome do prato deve ter no máximo 80 caracteres.');

    const { data: pratos, error: erroPratos } = await supabase
        .from('pratos')
        .select('id, nome')
        .eq('categoria_id', categoriaId);

    if (erroPratos) throw erroPratos;

    const duplicado = pratos.some(p =>
        p.nome.toLowerCase() === nome.toLowerCase() && p.id !== idAtual
    );

    if (duplicado) throw new AppError(409, `Já existe um prato chamado "${nome}" nesta categoria.`);

    if (corpo.preco === undefined || corpo.preco === null || String(corpo.preco).trim() === '') {
        throw new AppError(400, 'O preço do prato é obrigatório.');
    }

    const preco = typeof corpo.preco === 'string'
        ? Number(corpo.preco.replace(',', '.'))
        : corpo.preco;

    if (typeof preco !== 'number' || !Number.isFinite(preco) || preco <= 0) {
        throw new AppError(400, 'Preço inválido: informe um valor maior que zero.');
    }

    const descricao = typeof corpo.descricao === 'string' ? corpo.descricao.trim() : '';

    if (descricao.length > 300) {
        throw new AppError(400, 'A descrição deve ter no máximo 300 caracteres.');
    }

    if (corpo.disponivel !== undefined && typeof corpo.disponivel !== 'boolean') {
        throw new AppError(400, 'O campo "disponivel" deve ser verdadeiro ou falso.');
    }

    return {
        categoria_id: categoriaId,
        nome,
        descricao,
        preco: Math.round(preco * 100) / 100,
        disponivel: corpo.disponivel ?? true,
        imagem: corpo.imagem ?? imagemAtual
    };
}

// Converte categoria_id para categoriaId
function formatar(prato) {
    return { ...prato, categoriaId: prato.categoria_id };
}

// LISTAR
router.get('/', asyncHandler(async (req, res) => {
    let consulta = supabase.from('pratos').select('*').order('id');

    if (req.query.categoriaId !== undefined) {
        consulta = consulta.eq('categoria_id', lerId(req.query.categoriaId));
    }

    const { data, error } = await consulta;
    if (error) throw error;

    res.json(data.map(formatar));
}));

// BUSCAR um
router.get('/:id', asyncHandler(async (req, res) => {
    const prato = await buscarPrato(lerId(req.params.id));
    res.json(formatar(prato));
}));

// CRIAR
router.post('/', asyncHandler(async (req, res) => {
    const dados = await validar(req.body, null);

    const { data, error } = await supabase
        .from('pratos')
        .insert(dados)
        .select()
        .single();

    if (error) throw error;

    res.status(201).json(formatar(data));
}));

// ATUALIZAR
router.put('/:id', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const prato = await buscarPrato(id);
    const dados = await validar(req.body, id, prato.imagem || '');

    const { data, error } = await supabase
        .from('pratos')
        .update(dados)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    res.json(formatar(data));
}));

// DISPONÍVEL / INDISPONÍVEL
router.patch('/:id/disponibilidade', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const prato = await buscarPrato(id);

    const { data, error } = await supabase
        .from('pratos')
        .update({ disponivel: !prato.disponivel })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    res.json(formatar(data));
}));

// EXCLUIR
router.delete('/:id', asyncHandler(async (req, res) => {
    const id = lerId(req.params.id);
    const prato = await buscarPrato(id);

    const { error } = await supabase
        .from('pratos')
        .delete()
        .eq('id', id);

    if (error) throw error;

    res.json({ mensagem: `Prato "${prato.nome}" excluído com sucesso.` });
}));

module.exports = router;
