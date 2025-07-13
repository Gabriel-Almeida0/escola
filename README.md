# Sistema de Registros Escolares

Sistema simples para registros de alunos e controle de refeições/horas extras.

## Funcionalidades

- Cadastro de alunos
- Registro diário de refeições (almoço e jantar) e horas extras
- Visualização por calendário
- Geração de relatórios mensais
- Exportação de dados em CSV

## Tecnologias

- HTML, CSS e JavaScript puros
- IndexedDB para armazenamento local
- FontAwesome para ícones

## Como executar

1. Clone o repositório
2. Execute um servidor web local. Exemplo:
   ```
   npx http-server
   ```
3. Acesse http://localhost:8080 no navegador

## Estrutura do banco de dados

Os dados são armazenados localmente via IndexedDB:

- **students**: Informações dos alunos
- **daily_records**: Registros diários
- **calendar**: Eventos do calendário
- **reports**: Relatórios salvos

## Dados persistentes

Todos os dados são armazenados apenas no navegador usando IndexedDB, o que significa que:

1. Os dados persistem mesmo após fechar o navegador
2. Os dados são acessíveis apenas no dispositivo onde foram criados
3. Limpar os dados do navegador resultará na perda dos registros

## Arquivos principais

- `js/localdb.js`: Sistema de banco de dados local
- `js/storage.js`: API para manipulação de dados
- `js/config.js`: Configurações do banco de dados local 