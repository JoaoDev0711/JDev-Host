# JDev Host

Painel pessoal para organizar e controlar servidores de jogos em um notebook Linux.

## Jogos previstos

- Minecraft Java
- Minecraft Bedrock
- BeamNG.drive com BeamMP
- Euro Truck Simulator 2 com servidor dedicado Convoy

O painel permite cadastrar várias instâncias, mas a regra do host é manter **somente um servidor de jogo em execução por vez**.

## Arquitetura

```
GitHub Pages (JDev Host)
       │ HTTPS + autenticação
       ▼
Cloudflare Worker (API/ponte segura) ─── D1
       │ HTTPS com segredo no servidor
       ▼
Pterodactyl Panel (notebook Linux)
       │
       ▼
Wings + Docker ─── servidores de jogos
```

- Frontend estático no GitHub Pages.
- API separada no Cloudflare Worker `jdev-host-api`.
- Banco D1 `jdev-host-db`.
- Worker de API CurseForge permanece separado e inalterado.
- A arquitetura escolhida passa a usar Pterodactyl Panel + Wings como gerenciador de execução. O agente Linux próprio deixa de ser o caminho principal, evitando duplicar o gerenciamento de processos.
- O JDev Host acessará a API do Pterodactyl por uma ponte no Cloudflare Worker. A chave Client API ficará em segredo no Worker; nunca no navegador ou no repositório.
- O notebook precisará expor o painel Pterodactyl por HTTPS para a ponte conseguir alcançá-lo. O acesso dos jogadores aos servidores continua separado.
- A conectividade pública dos jogadores é separada da conexão painel-agente.

## API Cloudflare

Base URL: `https://jdev-host-api.joaoferreiraneto0711.workers.dev`

Rotas atuais:
- `GET /health` — saúde da API.
- `POST /api/claim` — troca do código inicial de uso único por token do painel.
- `GET /api/status` — estado do agente, fila e servidores.
- `GET|POST /api/servers` — listar e cadastrar servidores.
- `PUT|DELETE /api/servers/:id` — atualizar e excluir servidores.
- `POST /api/servers/:id/start` — solicitar inicialização.
- `POST /api/servers/:id/stop` — solicitar parada.
- `GET /api/servers/:id/logs` — consultar logs.
- `POST /api/agent/pair` — gerar credencial individual do agente.
- `POST /api/agent/poll` — buscar a próxima tarefa.
- `POST /api/agent/report` — reportar status, conclusão e logs.

Todas as rotas administrativas exigem token Bearer. O código inicial é de uso único; o token do painel é guardado no armazenamento local do navegador. O agente usa uma credencial diferente, armazenada como hash no D1.

## Estado da implementação

### Já criado
- Interface para os quatro jogos.
- Configuração de conexão do painel com a API.
- API Cloudflare e banco D1.
- Autenticação inicial de uso único e tokens separados para painel/agente.
- Cadastro, atualização, exclusão, fila de tarefas, status e logs na API.
- Regra de troca: ao solicitar outro servidor, a API enfileira a parada do servidor ativo antes da inicialização do próximo.

### Integração Pterodactyl — planejamento em andamento
- A tela Pterodactyl foi adicionada ao JDev Host para guardar o endereço HTTPS do painel e abri-lo em outra aba.
- A integração real por API ainda depende da instalação do Panel + Wings no notebook, de um endereço HTTPS acessível e de uma Client API key com permissões mínimas.
- A ponte Cloudflare ainda precisa implementar consulta de servidores/recursos e ações de energia permitidas, sem expor a chave ao navegador.
- A regra de apenas um servidor ativo precisa ser garantida também quando houver ações feitas diretamente no Pterodactyl; não liberar controles duplicados antes dessa validação.

### Ainda falta
1. Identificar CPU, RAM, arquitetura e sistema compatível do notebook CCE.
2. Instalar e testar Pterodactyl Panel, Wings e Docker no notebook.
3. Implementar a ponte segura de API entre JDev Host e Pterodactyl.
4. Preparar Eggs/configurações para Minecraft Java, Minecraft Bedrock, BeamMP e ETS2 Convoy.
5. Integrar console, recursos, arquivos e backups no JDev Host.
6. Testar conectividade dos jogadores e limites reais de CPU/RAM do notebook.

> **Importante:** a API já recebe e guarda configurações e tarefas, mas ainda não existe agente instalado no notebook. Portanto, iniciar/parar no painel ainda não executa os jogos até essa próxima etapa.

## Segurança

- O agente deve iniciar a conexão de saída; não expor SSH, terminal ou Docker socket à internet.
- Não aceitar shell arbitrário enviado pelo navegador.
- Executar somente operações permitidas por jogo, com caminhos controlados e limites de recursos.
- Tokens do painel e do agente são distintos.
- Credenciais nunca devem ser gravadas no repositório.

## Desenvolvimento

O frontend usa HTML, CSS e JavaScript puro. A API está em `cloudflare/api-worker/` e usa D1. A migração inicial do banco está em `cloudflare/api-worker/migrations/`.
