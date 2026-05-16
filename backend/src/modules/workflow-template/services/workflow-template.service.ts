import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermitType } from '@prisma/client';
import {
    WORKFLOW_CONFIG,
    WorkflowDefinition,
} from '../../permits/constants/workflow.config';
import {
    CreateWorkflowTemplateDto,
    UpdateWorkflowTemplateDto,
} from '../dto/workflow-template.dto';

@Injectable()
export class WorkflowTemplateService {
    private readonly logger = new Logger(WorkflowTemplateService.name);

    constructor(private prisma: PrismaService) {}

    /**
     * Create a new workflow template with its stages in a single transaction
     */
    async createTemplate(dto: CreateWorkflowTemplateDto) {
        return this.prisma.$transaction(async (tx) => {
            const template = await tx.workflowTemplate.create({
                data: {
                    name: dto.name,
                    description: dto.description,
                    permitType: dto.permitType,
                    stages: {
                        create: dto.stages.map((s) => ({
                            stage: s.stage,
                            order: s.order,
                            requiredRoles: s.requiredRoles,
                            slaDurationHours: s.slaDurationHours ?? 24,
                            slaWarningPercent: s.slaWarningPercent ?? 0.8,
                            isRequired: s.isRequired ?? true,
                        })),
                    },
                },
                include: {
                    stages: {
                        orderBy: { order: 'asc' },
                    },
                },
            });

            return template;
        });
    }

    /**
     * Get a single template by ID with stages ordered by order field
     */
    async getTemplate(id: string) {
        const template = await this.prisma.workflowTemplate.findUnique({
            where: { id },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!template) {
            throw new NotFoundException(`Workflow template with id ${id} not found`);
        }

        return template;
    }

    /**
     * Get the active template for a given permit type
     */
    async getTemplateByPermitType(permitType: PermitType) {
        const template = await this.prisma.workflowTemplate.findFirst({
            where: { permitType, isActive: true },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!template) {
            throw new NotFoundException(
                `No active workflow template found for permit type ${permitType}`,
            );
        }

        return template;
    }

    /**
     * List all templates with stage count
     */
    async listTemplates() {
        const templates = await this.prisma.workflowTemplate.findMany({
            include: {
                _count: {
                    select: { stages: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return templates;
    }

    /**
     * Update a template; if stages are provided, replace all stages in a transaction
     */
    async updateTemplate(id: string, dto: UpdateWorkflowTemplateDto) {
        await this.getTemplate(id); // throws if not found

        return this.prisma.$transaction(async (tx) => {
            if (dto.stages !== undefined) {
                // Replace all stages
                await tx.workflowTemplateStage.deleteMany({
                    where: { templateId: id },
                });

                await tx.workflowTemplateStage.createMany({
                    data: dto.stages.map((s) => ({
                        templateId: id,
                        stage: s.stage,
                        order: s.order,
                        requiredRoles: s.requiredRoles,
                        slaDurationHours: s.slaDurationHours ?? 24,
                        slaWarningPercent: s.slaWarningPercent ?? 0.8,
                        isRequired: s.isRequired ?? true,
                    })),
                });
            }

            const updated = await tx.workflowTemplate.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.permitType !== undefined && { permitType: dto.permitType }),
                },
                include: {
                    stages: {
                        orderBy: { order: 'asc' },
                    },
                },
            });

            return updated;
        });
    }

    /**
     * Delete a template (cascade deletes stages via DB constraint)
     */
    async deleteTemplate(id: string) {
        await this.getTemplate(id); // throws if not found

        return this.prisma.workflowTemplate.delete({
            where: { id },
        });
    }

    /**
     * Set isActive = true for a template
     */
    async activateTemplate(id: string) {
        await this.getTemplate(id); // throws if not found

        return this.prisma.workflowTemplate.update({
            where: { id },
            data: { isActive: true },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    /**
     * Set isActive = false for a template
     */
    async deactivateTemplate(id: string) {
        await this.getTemplate(id); // throws if not found

        return this.prisma.workflowTemplate.update({
            where: { id },
            data: { isActive: false },
            include: {
                stages: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    /**
     * Returns a WorkflowDefinition built from the active DB template for the
     * given permit type. Falls back to WORKFLOW_CONFIG if no active DB template
     * exists, ensuring backward compatibility.
     */
    async getWorkflowDefinition(permitType: PermitType): Promise<WorkflowDefinition> {
        try {
            const template = await this.prisma.workflowTemplate.findFirst({
                where: { permitType, isActive: true },
                include: {
                    stages: {
                        orderBy: { order: 'asc' },
                    },
                },
            });

            if (!template) {
                this.logger.debug(
                    `No active DB template for ${permitType}, falling back to WORKFLOW_CONFIG`,
                );
                return WORKFLOW_CONFIG[permitType];
            }

            const definition: WorkflowDefinition = {
                stages: template.stages.map((s) => s.stage),
                roles: {},
                sla: {},
            };

            for (const s of template.stages) {
                if (s.requiredRoles.length > 0) {
                    definition.roles[s.stage] = s.requiredRoles;
                }
                definition.sla[s.stage] = s.slaDurationHours;
            }

            return definition;
        } catch (error) {
            this.logger.error(
                `Failed to load DB workflow definition for ${permitType}, falling back to WORKFLOW_CONFIG`,
                error,
            );
            return WORKFLOW_CONFIG[permitType];
        }
    }
}
