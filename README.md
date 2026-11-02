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
GitHub Pages (painel)
       │ HTTPS + token
       ▼
Cloudflare Worker (API) ─── D1 (configurações, tarefas e logs)
       ▲
       │ HTTPS de saída, autenticado
       ▼
Agente Linux no notebook
       │
       └── processos dos servidores via terminal
```

- Frontend estático no GitHub Pages.
- API separada no Cloudflare Worker `jdev-host-api`.
- Banco D1 `jdev-host-db`.
- Worker de API CurseForge permanece separado e inalterado.
- O agente do notebook fará polling de tarefas por conexão de saída; não será necessário abrir uma porta administrativa no roteador.
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

### Ainda falta
1. Concluir a sincronização visual e testar no navegador.
2. Criar o agente Linux que consulta a fila, executa templates permitidos e envia telemetria.
3. Implementar instaladores e comandos específicos para ETS2 Convoy, BeamMP, Minecraft Java e Bedrock.
4. Transferir arquivos de mods/mundos para o notebook ou baixar arquivos diretamente de fontes autorizadas.
5. Testar conectividade dos jogadores e limites reais de CPU/RAM do notebook.

> **Importante:** a API já recebe e guarda configurações e tarefas, mas ainda não existe agente instalado no notebook. Portanto, iniciar/parar no painel ainda não executa os jogos até essa próxima etapa.

## Segurança

- O agente deve iniciar a conexão de saída; não expor SSH, terminal ou Docker socket à internet.
- Não aceitar shell arbitrário enviado pelo navegador.
- Executar somente operações permitidas por jogo, com caminhos controlados e limites de recursos.
- Tokens do painel e do agente são distintos.
- Credenciais nunca devem ser gravadas no repositório.

## Desenvolvimento

O frontend usa HTML, CSS e JavaScript puro. A API está em `cloudflare/api-worker/` e usa D1. A migração inicial do banco está em `cloudflare/api-worker/migrations/`.
