# Sistema de Registros Escolares

## Sobre o Projeto

Este projeto é uma versão HTML/CSS/JavaScript do aplicativo de gerenciamento escolar originalmente desenvolvido com React Native. O sistema permite gerenciar registros diários de alunos, incluindo controle de refeições (almoço e jantar) e horas extras.

## Funcionalidades

- **Registros Diários**: Controle de almoço, jantar e horas extras para cada aluno
- **Cadastro de Alunos**: Gerenciamento completo de alunos (adicionar, editar, excluir)
- **Calendário**: Visualização de registros por data, com resumo diário
- **Relatórios**: Geração de relatórios mensais com exportação para CSV

## Tecnologias Utilizadas

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **localStorage** para armazenamento de dados
- **FontAwesome** para ícones

## Como Executar

1. Clone o repositório
2. Abra o arquivo `index.html` em um navegador moderno
3. O sistema utilizará o localStorage do navegador para armazenar os dados localmente

## Estrutura do Projeto

```
html-version/
├── index.html         # Página principal (Registros Diários)
├── students.html      # Página de Gerenciamento de Alunos
├── calendar.html      # Página de Calendário
├── reports.html       # Página de Relatórios
├── css/
│   └── styles.css     # Estilos do sistema
└── js/
    ├── firebase-config.js # Configuração do Firebase (opcional)
    ├── storage.js      # Serviço de armazenamento
    ├── dateUtils.js    # Utilitários para manipulação de datas
    ├── index.js        # Script para a página de registros diários
    ├── students.js     # Script para a página de alunos
    ├── calendar.js     # Script para a página de calendário
    └── reports.js      # Script para a página de relatórios
```

## Nota Importante

Esta versão utiliza localStorage para armazenamento de dados, o que significa que os dados são armazenados apenas localmente no navegador. Para uma implementação completa com armazenamento em nuvem, seria necessário configurar o Firebase ou outro serviço de backend.