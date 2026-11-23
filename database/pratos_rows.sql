-- Inserção dos dados na tabela - Pratos
-- as imagens foram salvas em base64, devido ao texto muito longo, foi substituído por NULL para simplificar o código, no supabase as imagens estão inseridas e aparecem corretamente na aplicação

INSERT INTO public.pratos (id, nome, descricao, preco, categoria_id, disponivel, imagem)
VALUES
    (1, 'Galinha caipira guisada', 'Coxas de frango cozida acompanhado com  arroz branco, pirão, farofa na manteiga.', 33, 1, true, NULL),
    (2, 'Bife acebolado com batata frita', 'Bife acebolado acompanhado com arroz branco, batata frita e salada.', 25, 1, true, NULL), 
    (3, 'Patinho moido com quinoa', 'Carne magra moida refogada com abobrinha vuma porção de quinoa e salada verde.', 25, 2, true, NULL), 
    (4, 'Salmão grelhado com legumes', 'Filé de salmão grelhado acompanhado com arroz integral e legumes no vapor (brócolis, cenoura e abobrinha).', 24.5, 2, false, NULL), 
    (5, 'Strogonoff de frango sem lactose', 'Strogonoff de frango com champion, acompanhado com arroz branco e batata palha.', 21.9, 3, true, NULL), 
    (6, 'Frango ao molho', 'Sobrecoxas ao molho acompanhado com arroz branco, feijão, farofa e salada.', 18, 4, true, NULL), 
    (7, 'Bife à milanesa', 'Bife à milanesa acompanhado com arroz branco, macarrão, feijão e salada.', 20, 4, true, NULL), 
    (8, 'Peixe frito', 'Posta de peixe frito acompanhado com arroz branco, macarrão, feijão e salada.', 20, 4, true, NULL), 
    (9, 'Peixe assado com purê de abóbora', 'Filé de tilápia assado com purê de abóbora e legumes.', 35, 3, true, NULL), 
    (10, 'Fígado acebolado', 'Fígado acompanhado de arroz branco, feijão, purê e salada.', 20, 4, true, NULL), 
    (11, 'Feijoada da casa', 'Feijoada (feijão preto com carnes de porco e linguiça) acompanhada de arroz branco, farofa, couve refogada e rodelas de laranja.', 30, 1, true, NULL);