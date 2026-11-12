// "Banco de dados" em arquivo JSON (db.json). É criado automaticamente na primeira execução.
const fs = require('fs');
const path = require('path');

const ARQUIVO = path.join(__dirname, 'db.json');

const INICIAL = {
    categorias: [
        { id: 1, nome: 'Linha Caseira',        imagem: 'assets/img/linha-caseira.jpg',    ativa: true  },
        { id: 2, nome: 'Linha Fitness',        imagem: 'assets/img/linha-fitness.jpg',    ativa: true  },
        { id: 3, nome: 'Restrições Especiais', imagem: 'assets/img/linha-restricoes.png', ativa: false },
        { id: 4, nome: 'Linha Econômica',      imagem: 'assets/img/linha-economica.jpg',  ativa: true  }
    ],
    pratos: []
};

function salvar(dados) {
    fs.writeFileSync(ARQUIVO, JSON.stringify(dados, null, 2), 'utf8');
}

function carregar() {
    if (!fs.existsSync(ARQUIVO)) salvar(INICIAL);
    return JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
}

function proximoId(lista) {
    return lista.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
}

module.exports = { carregar, salvar, proximoId };
