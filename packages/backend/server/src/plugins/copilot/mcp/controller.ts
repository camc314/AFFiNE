import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Controller, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../../core/auth';
import { WorkspaceMcpProvider } from './provider';

@Controller('/api/workspaces/:workspaceId/mcp')
export class WorkspaceMcpController {
  constructor(private readonly provider: WorkspaceMcpProvider) {}

  @Post('/')
  async mcp(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: CurrentUser,
    @Param('workspaceId') workspaceId: string
  ) {
    const server = await this.provider.for(user.id, workspaceId);

    const transport: StreamableHTTPServerTransport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

    res.on('close', () => {
      (async () => {
        await transport.close();
        await server.close();
      })().catch(() => {});
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }
}
