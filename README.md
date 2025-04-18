# Sistema de Reserva de Recursos (EM DESENVOLVIMENTO)

Este projeto é uma API RESTful para um sistema de gerenciamento e reserva de recursos (ex: salas, mesas, equipamentos), construído com Node.js, Express, TypeScript e PostgreSQL.

---

## ⚙️ Tecnologias Utilizadas

* **Backend:** Node.js, Express.js, TypeScript
* **Banco de Dados:** PostgreSQL
* **ORM:** Prisma
* **Autenticação:** JWT (JSON Web Tokens)
* **(Frontend Planejado):** React com TypeScript

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/) (Versão 18.x ou superior recomendada)
* [npm](https://www.npmjs.com/) (geralmente vem com o Node.js) ou [Yarn](https://yarnpkg.com/)
* [Git](https://git-scm.com/)
* [PostgreSQL](https://www.postgresql.org/) instalado e um servidor rodando.

---

## 🚀 Instalação e Configuração

Siga os passos abaixo para configurar e rodar o projeto localmente:

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/rodrigocvmd/plataforma-de-reservas
    cd plataforma-de-reservas
    ```

2.  **Instale as Dependências:**
    * Como o projeto utiliza `package-lock.json`, o gerenciador de pacotes recomendado é o `npm`.
        ```bash
        npm install
        ```
    * *(Se preferir usar Yarn, delete o `package-lock.json` e rode `yarn install`)*

3.  **Configure as Variáveis de Ambiente:**
    * Este projeto requer um arquivo `.env` na raiz para configurar variáveis essenciais.
    * **Crie** um arquivo chamado `.env` na raiz do projeto.
    * Adicione as seguintes variáveis a ele, substituindo pelos seus valores:

        ```dotenv
        # Exemplo de conteúdo para o arquivo .env

        # String de conexão do seu banco de dados PostgreSQL
        # Formato: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
        DATABASE_URL="postgresql://seu_usuario:sua_senha@localhost:5432/nome_do_banco?schema=public"

        # Chave secreta para gerar os tokens JWT (use uma string longa e segura)
        JWT_SECRET="SUA_CHAVE_SECRETA_FORTE_AQUI"

        # Porta em que o servidor irá rodar (opcional, padrão 3000 se não definida)
        # PORT=3000
        ```
    * **Importante:** Certifique-se de que o banco de dados (`nome_do_banco` no exemplo acima) exista no seu servidor PostgreSQL antes do próximo passo. Você pode criá-lo usando `createdb nome_do_banco` no terminal ou através de uma ferramenta gráfica.
    * *(Recomendação: Crie também um arquivo `.env.example` com as chaves acima, mas sem os valores secretos, e adicione-o ao Git. O arquivo `.env` deve ser adicionado ao `.gitignore`)*

4.  **Execute as Migrações do Banco de Dados:**
    * Este comando aplicará as migrações do Prisma para criar as tabelas no seu banco de dados.
        ```bash
        npx prisma migrate dev
        ```
    * *(Opcional)* Pode ser necessário rodar `npx prisma generate` se o cliente Prisma não for gerado automaticamente após a migração.

---

## ▶️ Executando o Projeto

Após a instalação e configuração, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O servidor estará rodando na porta definida no seu arquivo `.env` (ou na porta 3000 por padrão). Você verá uma mensagem no console indicando que o servidor foi iniciado.

---

## 🧪 Testes (Opcional)

Para rodar os testes automatizados (se configurados):

```bash
npm test
```

---

## 🌟 Diferenciais do Sistema

* **Gerenciamento de Tempo**:
    * Reservas baseadas em horários específicos.
    * Validações para evitar conflitos de reservas.
* **Regras de Uso Personalizadas**:
    * Configuração de políticas para recursos (ex.: limite de horas, prioridade de usuários).
* **Notificações por Email**:
    * Confirmações e lembretes automáticos enviados aos usuários.
    * Integração com **APIs de email** como **Nodemailer**.

---

## 🚀 Funcionalidades Implementadas

1.  **Autenticação e Autorização:**
    * Registro e Login de usuários (USER, ADMIN) com JWT.
    * Middlewares de verificação de token e roles.
2.  **Gerenciamento de Usuários (CRUD):**
    * Operações básicas de criação, leitura, atualização e deleção para usuários (com controle de acesso).
3.  **Gerenciamento de Recursos (CRUD):**
    * Operações básicas para recursos (salas, etc.), com controle de acesso por proprietário (Owner) ou Admin.
4.  **Gerenciamento de Horários Disponíveis (CRUD):**
    * Definição de blocos de tempo disponíveis (`Schedule`) e indisponíveis (`UnavailableSlot`) para recursos, com controle de acesso.
5.  **Gerenciamento de Reservas (CRUD):**
    * Criação, visualização e cancelamento de reservas, com controle de acesso (Admin, Dono da reserva).
    * Validação básica de disponibilidade de horário.

---

## 💡 Benefícios do Projeto

* **Aprendizado Técnico**:
    * Implementação de validações complexas no backend.
    * Integração de notificações via APIs de email.
* **Relevância para Portfólio**:
    * Sistema corporativo comum, com aplicação prática no mercado.
    * Demonstra habilidades em gerenciamento de recursos e integrações avançadas.

---

## 🛠️ Próximas Etapas

1.  Refinar regras de negócio (ex: antecedência de cancelamento, limites de reserva).
2.  Implementar testes automatizados mais abrangentes (unitários/integração).
3.  (Opcional) Adicionar funcionalidade de upload de imagens para recursos.
4.  Desenvolver a interface frontend com React.
5.  Documentar a API (ex: Swagger/OpenAPI).
6.  Preparar para deploy.

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

```
