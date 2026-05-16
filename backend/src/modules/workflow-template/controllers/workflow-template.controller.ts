import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role, PermitType } from '@prisma/client';
import { WorkflowTemplateService } from '../services/workflow-template.service';
import {
    CreateWorkflowTemplateDto,
    UpdateWorkflowTemplateDto,
} from '../dto/workflow-template.dto';

@Controller('workflow-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WorkflowTemplateController {
    constructor(private workflowTemplateService: WorkflowTemplateService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTemplate(@Body() dto: CreateWorkflowTemplateDto) {
        return this.workflowTemplateService.createTemplate(dto);
    }

    @Get()
    async listTemplates() {
        return this.workflowTemplateService.listTemplates();
    }

    @Get('permit-type/:permitType')
    async getTemplateByPermitType(@Param('permitType') permitType: PermitType) {
        return this.workflowTemplateService.getTemplateByPermitType(permitType);
    }

    @Get(':id')
    async getTemplate(@Param('id') id: string) {
        return this.workflowTemplateService.getTemplate(id);
    }

    @Put(':id')
    async updateTemplate(
        @Param('id') id: string,
        @Body() dto: UpdateWorkflowTemplateDto,
    ) {
        return this.workflowTemplateService.updateTemplate(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteTemplate(@Param('id') id: string) {
        await this.workflowTemplateService.deleteTemplate(id);
    }

    @Patch(':id/activate')
    async activateTemplate(@Param('id') id: string) {
        return this.workflowTemplateService.activateTemplate(id);
    }

    @Patch(':id/deactivate')
    async deactivateTemplate(@Param('id') id: string) {
        return this.workflowTemplateService.deactivateTemplate(id);
    }
}
