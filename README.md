# TCC Manager

Sistema Web para gerenciamento de projetos de TCC. Com funcionalidades de criação de perfil, gerenciamento de atividades, agendamentos, cadastro de instituições, integrado com node.js e banco de dados json.

## Funcionalidades Gerais

O sistema possui as seguintes funcionalidades:

- Autoadastro de Contas
- Cadastro de Entidades (Instituições e Cursos)
- Autenticação de Login
- Criação de Projetos
- Validação de Convites para participação
- Agendamento de Reuniões
- Envio de Mensagens
- Visualização de Catálogo
- Gerenciamento de Usuários
- Aprovação de Projetos

Essas funcionalidades estão restringidas ao nivel de acesso de cada perfil (Aluno, Professor ou Administrador).

## Como Rodar o Sistema Localmente

**Pré-requisito:**  Node.js: Você precisará do Node.js instalado em sua máquina. Recomenda-se a versão LTS mais recente (versão 18, 20 ou 22).

### **Passo a Passo para Instalação e Execução**

### **1: Instalar todas as dependências.**

Abra o terminal integrado do VS Code (Ctrl + " ou Cmd + " no macOS) e execute o comando abaixo para baixar e instalar de forma automatizada todas as bibliotecas de desenvolvimento e produção:

```
npm install
```

Este comando lerá as dependências listadas no seu package.json, que incluem bibliotecas como React 19, Vite 6, Express, Tailwind CSS v4, BcryptJS (criptografia de senhas), JSONWebToken (autenticação JWT) e Lucide React (ícones).

### **2: Configurar as Variáveis de Ambiente**

Na raiz de seu projeto (onde está o arquivo .env.example), crie uma cópia deste arquivo chamada apenas .env:

```
No Windows (PowerShell):
copy .env.example .env
```
```
No macOS/Linux (Terminal):
cp .env.example .env
```

Abra o arquivo .env recém-criado no seu VS Code e configure as seguintes variáveis básicas necessárias para o backend do sistema rodar:

```
# Chave secreta usada para assinar os tokens JWT de login (você pode colocar qualquer frase segura)
JWT_SECRET="uma-frase-secreta-e-segura"
```

### **3: Executar o Aplicativo**

Após instalar e configurar as variáveis, basta rodar o servidor de desenvolvimento:
```
npm run dev
```
Este comando utilizará a ferramenta tsx para iniciar o arquivo server.ts integrando tanto a API em Express quanto a interface em Vite/React simultaneamente sob a mesma porta.

### **4. Como Acessar o Sistema**

Assim que o comando de inicialização for concluído, ele exibirá no terminal a URL local de acesso:
- Acesse: http://localhost:3000

## Perfis e Controle de Acesso do Sistema

### Administrador

- Usuário: admin@tcc.com
- Senha: admin123

- Edita informações do Perfil 
- Visualiza Dashboards estatísticos de projetos
- Gerencia usuários cadastrados no sistema
- Visualiza Projetos cadastrados no sistema
- Visualiza Catálogo de TCCs

### Aluno

- Edita informações do Perfil
- Cria novo projeto
- Gerencia projeto (Cria tarefas, adiciona arquivos, solicita reuniões, envia mensagens, submete projeto)
- Visualiza Dashboards estatísticos de projetos
- Visualiza Catálogo de TCCs

### Professor

- Edita informações do Perfil
- Aceita solicitação de Projetos
- Orienta Projetos (Envia Feedbacks, responde a solicitações de reuniões, envia mensagens, avalia projeto)
- Visualiza Dashboards estatísticos de projetos
- Visualiza Catálogo de TCCs

## Tecnologias Utilizadas para o Desenvolvimento

- TypeScript (TSX)
- HTML5 & CSS3
- React 19
- Tailwind CSS v4.0
- Motion (Motion/React)
- Lucide React
- Node.js
- Banco de dados JSON local (json.db)

## Observações

- Este é apenas um protótipo, o sistema está planejado para evoluir para um futuro lançamento com banco de dados e serviços separados da máquina local.
- Mais informações técnicas sobre o desenvolvimento do software TCC Manager estão presentes na documentação de análise e elicitação de requisitos.
