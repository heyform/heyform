import {
  Body,
  Controller,
  Delete,
  DynamicModule,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Type,
  UseGuards
} from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AccountApiKeysController, AccountApiKeysGuard } from './account-api-keys.controller'
import { ApiKey, ApiKeySchema, ApiKeyService } from './api-key.service'
import { McpController } from './mcp.controller'
import { ApiRequest, RestApiKeyGuard } from './rest-api-key.guard'
import { RestApiService } from './rest-api.service'
import { AuthGuard } from '@guard'

@Controller('api/v1')
@UseGuards(RestApiKeyGuard)
export class RestApiController {
  constructor(private readonly api: RestApiService) {}

  @Get('health')
  health() {
    return { status: 'ok', version: 'v1' }
  }

  @Get('workspaces')
  workspaces(@Req() req: ApiRequest) {
    return this.api.workspaces(req.apiPrincipal)
  }

  @Get('workspaces/:id/projects')
  listProjects(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.listProjects(req.apiPrincipal, id)
  }

  @Get('users/me')
  getCurrentUser(@Req() req: ApiRequest) {
    return this.api.getCurrentUser(req.apiPrincipal)
  }

  @Get('workspaces/:id')
  getWorkspace(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.getWorkspace(req.apiPrincipal, id)
  }

  @Patch('workspaces/:id')
  updateWorkspace(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.updateWorkspace(req.apiPrincipal, id, body)
  }

  @Get('users/:id')
  getUser(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.getUser(req.apiPrincipal, id)
  }

  @Post('workspaces/:id/projects')
  createProject(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.createProject(req.apiPrincipal, id, body)
  }

  @Get('workspaces/:id/members')
  listMembers(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.listMembers(req.apiPrincipal, id)
  }

  @Post('workspaces/:id/invitations')
  inviteMembers(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.inviteMembers(req.apiPrincipal, id, body)
  }

  @Delete('workspaces/:id/members/:userId')
  removeMember(@Req() req: ApiRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.api.removeMember(req.apiPrincipal, id, userId)
  }

  @Patch('projects/:id')
  renameProject(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.renameProject(req.apiPrincipal, id, body)
  }

  @Get('projects/:id/forms')
  listForms(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.listForms(req.apiPrincipal, id)
  }

  @Post('projects/:id/forms')
  createForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.createForm(req.apiPrincipal, id, body)
  }

  @Patch('forms/:id')
  renameForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.renameForm(req.apiPrincipal, id, body)
  }

  @Post('forms/:id/duplicate')
  duplicateForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.duplicateForm(req.apiPrincipal, id, body)
  }

  @Post('forms/:id/move')
  moveForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.moveForm(req.apiPrincipal, id, body)
  }

  @Patch('forms/:id/hidden-fields')
  updateHiddenFields(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.updateHiddenFields(req.apiPrincipal, id, body)
  }

  @Patch('forms/:id/variables')
  updateVariables(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.updateVariables(req.apiPrincipal, id, body)
  }

  @Patch('forms/:id/settings')
  updateSettings(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.updateSettings(req.apiPrincipal, id, body)
  }

  @Patch('forms/:id/theme')
  updateTheme(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.updateTheme(req.apiPrincipal, id, body)
  }

  @Post('forms/:id/trash')
  trashForm(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.trashForm(req.apiPrincipal, id)
  }

  @Post('forms/:id/restore')
  restoreForm(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.restoreForm(req.apiPrincipal, id)
  }

  @Patch('forms/:id/drafts')
  updateDrafts(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.updateDrafts(req.apiPrincipal, id, body)
  }

  @Post('forms/:id/publish')
  publishForm(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.publishForm(req.apiPrincipal, id, body)
  }

  @Post('forms/:id/unpublish')
  unpublishForm(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.unpublishForm(req.apiPrincipal, id)
  }

  @Patch('forms/:id/availability')
  setFormAvailability(@Req() req: ApiRequest, @Param('id') id: string, @Body() body: any) {
    return this.api.setFormAvailability(req.apiPrincipal, id, body)
  }

  @Get('forms/:id/submissions/:submissionId')
  getSubmission(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string
  ) {
    return this.api.getSubmission(req.apiPrincipal, id, submissionId)
  }

  @Patch('forms/:id/submissions/:submissionId/category')
  updateSubmissionCategory(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: any
  ) {
    return this.api.updateSubmissionCategory(req.apiPrincipal, id, submissionId, body)
  }

  @Patch('forms/:id/submissions/:submissionId/answer')
  editSubmissionAnswer(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Param('submissionId') submissionId: string,
    @Body() body: any
  ) {
    return this.api.editSubmissionAnswer(req.apiPrincipal, id, submissionId, body)
  }

  @Get('forms/:id/submissions')
  listSubmissions(
    @Req() req: ApiRequest,
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '30'
  ) {
    return this.api.listSubmissions(req.apiPrincipal, id, Number(page), Number(limit))
  }

  @Get('forms/:id')
  getForm(@Req() req: ApiRequest, @Param('id') id: string) {
    return this.api.getForm(req.apiPrincipal, id)
  }
}

@Module({})
export class RestApiModule {
  static register(serviceModule: Type<any>): DynamicModule {
    return {
      module: RestApiModule,
      imports: [
        serviceModule,
        MongooseModule.forFeature([{ name: ApiKey.name, schema: ApiKeySchema }])
      ],
      controllers: [RestApiController, AccountApiKeysController, McpController],
      providers: [RestApiService, ApiKeyService, RestApiKeyGuard, AccountApiKeysGuard, AuthGuard]
    }
  }
}
