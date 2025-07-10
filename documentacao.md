# Documentação do Aplicativo de Gestão Escolar

## Visão Geral

O Sistema de Gestão Escolar é uma aplicação mobile/web desenvolvida para controlar e gerenciar refeições e horas extras dos alunos. A aplicação permite o cadastro de alunos, o registro diário de almoço, jantar e horas extras, além da geração de relatórios mensais com dados consolidados.

## Principais Funcionalidades

### 1. Registro Diário de Refeições

- **Tela Inicial**: Exibe todos os alunos cadastrados e permite registrar almoço, jantar e horas extras para cada aluno no dia atual.
- **Filtros**: Permite filtrar alunos por turma e status de refeição (almoço, jantar, ambos ou nenhum).
- **Atualização em Tempo Real**: Todos os registros são salvos automaticamente e podem ser atualizados a qualquer momento.

### 2. Gestão de Alunos

- **Cadastro Completo**: Permite adicionar, editar e excluir alunos do sistema.
- **Dados do Aluno**: Armazena nome, turma e foto (opcional) de cada aluno.
- **Busca Rápida**: Ferramenta de busca por nome ou turma para facilitar a localização dos alunos.

### 3. Calendário de Registros

- **Visualização por Data**: Permite selecionar qualquer data para visualizar e editar os registros de refeições.
- **Marcação Clara**: O dia atual é claramente marcado para fácil identificação.
- **Histórico Completo**: Acesso ao histórico completo de refeições de todos os alunos.

### 4. Relatórios Mensais

- **Dados Consolidados**: Exibe o total de almoços, jantares e horas extras por aluno em cada mês.
- **Resumo Visual**: Apresenta cards com totais consolidados para rápida visualização.
- **Exportação**: Permite exportar os dados em formato CSV para uso em outros sistemas.

## Tecnologias Utilizadas

- **Plataforma**: Desenvolvido com Expo/React Native, funcionando em dispositivos móveis (Android e iOS) e na web.
- **Armazenamento**: Utiliza AsyncStorage para armazenar dados localmente no dispositivo.
- **Interface**: Design moderno e responsivo com foco em usabilidade.

## Como Utilizar

### Fluxo de Trabalho Diário

1. **Abertura do App**: Na tela inicial, visualize todos os alunos cadastrados.
2. **Registro de Refeições**: Para cada aluno presente, marque almoço e/ou jantar conforme necessário.
3. **Registro de Horas Extras**: Se aplicável, registre as horas extras do aluno (até 5 horas).
4. **Filtros**: Use os filtros por turma ou status para gerenciar grandes quantidades de alunos.

### Gestão Mensal

1. **Acesse Relatórios**: Na aba de relatórios, selecione o mês desejado.
2. **Analise os Dados**: Visualize os totais de refeições e horas extras por aluno.
3. **Exporte os Dados**: Use o botão de exportar para gerar um arquivo CSV com os dados consolidados.

### Manutenção do Cadastro

1. **Adicionar Alunos**: Na aba Alunos, use o botão "+" para adicionar novos alunos.
2. **Editar Informações**: Clique no ícone de edição para atualizar dados dos alunos.
3. **Remover Alunos**: Use o ícone de lixeira para remover alunos que não frequentam mais a escola.

## Benefícios

- **Controle Preciso**: Elimina erros de contagem manual de refeições e horas extras.
- **Economia de Tempo**: Automatiza o processo de registro e geração de relatórios.
- **Dados Seguros**: Todas as informações são armazenadas de forma segura no dispositivo.
- **Interface Intuitiva**: Design simples e direto, facilitando o uso por qualquer pessoa.
- **Acesso Multiplataforma**: Funciona em dispositivos móveis e computadores, adaptando-se à necessidade do usuário.

## Requisitos do Sistema

- **Web**: Navegador moderno (Chrome, Firefox, Safari ou Edge)
- **Mobile**: Android 5.0+ ou iOS 12+
- **Armazenamento**: Mínimo de 50MB de espaço livre

## Suporte e Contato

Para suporte técnico ou dúvidas sobre o funcionamento do aplicativo, entre em contato com nossa equipe de suporte.