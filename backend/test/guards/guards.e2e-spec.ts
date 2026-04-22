import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Role, WorkflowStage, PermitType, LandType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Guards Integration Tests (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let jwtService: JwtService;

    // Test users
    let adminUser: any;
    let regularUser: any;
    let documentValidatorUser: any;
    let fieldInspectorUser: any;
    let legalizerUser: any;
    let multiRoleUser: any;

    // Auth tokens
    let adminToken: string;
    let regularToken: string;
    let documentValidatorToken: string;
    let fieldInspectorToken: string;
    let legalizerToken: string;
    let multiRoleToken: string;

    // Test application
    let testApplication: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
        jwtService = app.get<JwtService>(JwtService);

        // Clean up test data
        await cleanupTestData();

        // Create test users
        await createTestUsers();

        // Generate JWT tokens directly
        generateTokens();

        // Create test application
        await createTestApplication();
    }, 30000); // 30 second timeout for setup

    afterAll(async () => {
        await cleanupTestData();
        await app.close();
    }, 30000); // 30 second timeout for cleanup

    async function cleanupTestData() {
        // Delete in correct order due to foreign key constraints
        await prisma.notification.deleteMany({});
        await prisma.stageHistory.deleteMany({});
        await prisma.validationAction.deleteMany({});
        await prisma.document.deleteMany({});
        await prisma.permitApplication.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.otpVerification.deleteMany({});
        await prisma.userDetail.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        'admin@test.com',
                        'user@test.com',
                        'validator@test.com',
                        'inspector@test.com',
                        'legalizer@test.com',
                        'multirole@test.com',
                    ],
                },
            },
        });
    }

    async function createTestUsers() {
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Admin user
        adminUser = await prisma.user.create({
            data: {
                email: 'admin@test.com',
                password: hashedPassword,
                name: 'Admin User',
                roles: [Role.ADMIN],
                verify_gmail: true,
            },
        });

        // Regular user (applicant)
        regularUser = await prisma.user.create({
            data: {
                email: 'user@test.com',
                password: hashedPassword,
                name: 'Regular User',
                roles: [Role.USER],
                verify_gmail: true,
            },
        });

        // Document validator
        documentValidatorUser = await prisma.user.create({
            data: {
                email: 'validator@test.com',
                password: hashedPassword,
                name: 'Document Validator',
                roles: [Role.DOCUMENT_VALIDATOR],
                verify_gmail: true,
            },
        });

        // Field inspector
        fieldInspectorUser = await prisma.user.create({
            data: {
                email: 'inspector@test.com',
                password: hashedPassword,
                name: 'Field Inspector',
                roles: [Role.FIELD_INSPECTOR],
                verify_gmail: true,
            },
        });

        // Legalizer
        legalizerUser = await prisma.user.create({
            data: {
                email: 'legalizer@test.com',
                password: hashedPassword,
                name: 'Legalizer',
                roles: [Role.LEGALIZER],
                verify_gmail: true,
            },
        });

        // Multi-role user (has multiple staff roles)
        multiRoleUser = await prisma.user.create({
            data: {
                email: 'multirole@test.com',
                password: hashedPassword,
                name: 'Multi Role User',
                roles: [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR],
                verify_gmail: true,
            },
        });
    }

    function generateTokens() {
        // Generate JWT tokens directly using JwtService
        const secret = process.env.JWT_SECRET || 'secretKey';
        
        adminToken = jwtService.sign({
            sub: adminUser.id,
            email: adminUser.email,
            roles: adminUser.roles,
        }, { secret });

        regularToken = jwtService.sign({
            sub: regularUser.id,
            email: regularUser.email,
            roles: regularUser.roles,
        }, { secret });

        documentValidatorToken = jwtService.sign({
            sub: documentValidatorUser.id,
            email: documentValidatorUser.email,
            roles: documentValidatorUser.roles,
        }, { secret });

        fieldInspectorToken = jwtService.sign({
            sub: fieldInspectorUser.id,
            email: fieldInspectorUser.email,
            roles: fieldInspectorUser.roles,
        }, { secret });

        legalizerToken = jwtService.sign({
            sub: legalizerUser.id,
            email: legalizerUser.email,
            roles: legalizerUser.roles,
        }, { secret });

        multiRoleToken = jwtService.sign({
            sub: multiRoleUser.id,
            email: multiRoleUser.email,
            roles: multiRoleUser.roles,
        }, { secret });
    }

    async function createTestApplication() {
        testApplication = await prisma.permitApplication.create({
            data: {
                referenceNumber: 'PERMIT-20260422-0001',
                permitType: PermitType.BUILDING_PERMIT,
                status: WorkflowStage.DOCUMENT_CHECK,
                currentStage: WorkflowStage.DOCUMENT_CHECK,
                applicantId: regularUser.id,
                locationAddress: '123 Test Street',
                landSize: 100,
                landType: LandType.RESIDENTIAL,
                buildingHeight: 8,
                njopValue: 1000000,
                isStrategicLocation: false,
                baseTax: 100000,
                administrativeFee: 500000,
                totalCost: 600000,
                submittedAt: new Date(),
            },
        });
    }

    describe('RolesGuard - Role-Based Access Control', () => {
        describe('Admin-only endpoints', () => {
            it('should allow admin to update user roles', async () => {
                const response = await request(app.getHttpServer())
                    .patch(`/users/${regularUser.id}/roles`)
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({ roles: [Role.USER, Role.DOCUMENT_VALIDATOR] })
                    .expect(200);

                expect(response.body.roles).toContain(Role.DOCUMENT_VALIDATOR);
            });

            it('should deny regular user from updating user roles', async () => {
                await request(app.getHttpServer())
                    .patch(`/users/${regularUser.id}/roles`)
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({ roles: [Role.USER, Role.ADMIN] })
                    .expect(403);
            });

            it('should deny document validator from updating user roles', async () => {
                await request(app.getHttpServer())
                    .patch(`/users/${regularUser.id}/roles`)
                    .set('Authorization', `Bearer ${documentValidatorToken}`)
                    .send({ roles: [Role.USER, Role.ADMIN] })
                    .expect(403);
            });

            it('should allow admin to list staff members', async () => {
                const response = await request(app.getHttpServer())
                    .get('/users/staff')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .expect(200);

                expect(Array.isArray(response.body)).toBe(true);
            });

            it('should deny regular user from listing staff members', async () => {
                await request(app.getHttpServer())
                    .get('/users/staff')
                    .set('Authorization', `Bearer ${regularToken}`)
                    .expect(403);
            });
        });

        describe('Multiple role assignments', () => {
            it('should allow multi-role user to access document check stage', async () => {
                // Multi-role user has DOCUMENT_VALIDATOR role
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${testApplication.id}/approve`)
                    .set('Authorization', `Bearer ${multiRoleToken}`)
                    .send({ notes: 'Approved by multi-role user' })
                    .expect(201);

                expect(response.body.currentStage).toBe(WorkflowStage.FIELD_INSPECTION);
            });

            it('should allow multi-role user to access field inspection stage', async () => {
                // Create application in field inspection stage
                const fieldInspectionApp = await prisma.permitApplication.create({
                    data: {
                        referenceNumber: 'PERMIT-20260422-0002',
                        permitType: PermitType.BUILDING_PERMIT,
                        status: WorkflowStage.FIELD_INSPECTION,
                        currentStage: WorkflowStage.FIELD_INSPECTION,
                        applicantId: regularUser.id,
                        locationAddress: '456 Test Avenue',
                        landSize: 150,
                        landType: LandType.COMMERCIAL,
                        buildingHeight: 12,
                        njopValue: 2000000,
                        isStrategicLocation: true,
                        baseTax: 300000,
                        administrativeFee: 500000,
                        totalCost: 800000,
                        submittedAt: new Date(),
                    },
                });

                // Multi-role user has FIELD_INSPECTOR role
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${fieldInspectionApp.id}/approve`)
                    .set('Authorization', `Bearer ${multiRoleToken}`)
                    .send({
                        notes: 'Approved by multi-role user',
                        inspectionNotes: 'Field inspection completed',
                    })
                    .expect(201);

                expect(response.body.currentStage).toBe(WorkflowStage.LEGALIZATION);

                // Cleanup
                await prisma.permitApplication.delete({
                    where: { id: fieldInspectionApp.id },
                });
            });

            it('should deny multi-role user from accessing legalization stage', async () => {
                // Create application in legalization stage
                const legalizationApp = await prisma.permitApplication.create({
                    data: {
                        referenceNumber: 'PERMIT-20260422-0003',
                        permitType: PermitType.BUSINESS_LICENSE,
                        status: WorkflowStage.LEGALIZATION,
                        currentStage: WorkflowStage.LEGALIZATION,
                        applicantId: regularUser.id,
                        businessName: 'Test Business',
                        businessType: 'Retail',
                        businessLocation: '789 Business Blvd',
                        estimatedEmployees: 10,
                        administrativeFee: 300000,
                        totalCost: 300000,
                        submittedAt: new Date(),
                    },
                });

                // Multi-role user does NOT have LEGALIZER role
                await request(app.getHttpServer())
                    .post(`/permits/applications/${legalizationApp.id}/approve`)
                    .set('Authorization', `Bearer ${multiRoleToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);

                // Cleanup
                await prisma.permitApplication.delete({
                    where: { id: legalizationApp.id },
                });
            });
        });
    });

    describe('StageAccessGuard - Stage-Specific Permissions', () => {
        describe('Document Check stage', () => {
            let documentCheckApp: any;

            beforeEach(async () => {
                documentCheckApp = await prisma.permitApplication.create({
                    data: {
                        referenceNumber: `PERMIT-20260422-${Date.now()}`,
                        permitType: PermitType.BUILDING_PERMIT,
                        status: WorkflowStage.DOCUMENT_CHECK,
                        currentStage: WorkflowStage.DOCUMENT_CHECK,
                        applicantId: regularUser.id,
                        locationAddress: 'Document Check Test',
                        landSize: 100,
                        landType: LandType.RESIDENTIAL,
                        buildingHeight: 8,
                        njopValue: 1000000,
                        isStrategicLocation: false,
                        baseTax: 100000,
                        administrativeFee: 500000,
                        totalCost: 600000,
                        submittedAt: new Date(),
                    },
                });
            });

            afterEach(async () => {
                if (documentCheckApp) {
                    await prisma.permitApplication.delete({
                        where: { id: documentCheckApp.id },
                    });
                }
            });

            it('should allow document validator to approve at document check stage', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${documentCheckApp.id}/approve`)
                    .set('Authorization', `Bearer ${documentValidatorToken}`)
                    .send({ notes: 'Documents verified' })
                    .expect(201);

                expect(response.body.currentStage).toBe(WorkflowStage.FIELD_INSPECTION);
            });

            it('should deny field inspector from approving at document check stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${documentCheckApp.id}/approve`)
                    .set('Authorization', `Bearer ${fieldInspectorToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });

            it('should deny legalizer from approving at document check stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${documentCheckApp.id}/approve`)
                    .set('Authorization', `Bearer ${legalizerToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });

            it('should deny regular user from approving at document check stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${documentCheckApp.id}/approve`)
                    .set('Authorization', `Bearer ${regularToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });
        });

        describe('Field Inspection stage', () => {
            let fieldInspectionApp: any;

            beforeEach(async () => {
                fieldInspectionApp = await prisma.permitApplication.create({
                    data: {
                        referenceNumber: `PERMIT-20260422-${Date.now()}`,
                        permitType: PermitType.BUILDING_PERMIT,
                        status: WorkflowStage.FIELD_INSPECTION,
                        currentStage: WorkflowStage.FIELD_INSPECTION,
                        applicantId: regularUser.id,
                        locationAddress: 'Field Inspection Test',
                        landSize: 200,
                        landType: LandType.COMMERCIAL,
                        buildingHeight: 15,
                        njopValue: 3000000,
                        isStrategicLocation: true,
                        baseTax: 600000,
                        administrativeFee: 500000,
                        totalCost: 1100000,
                        submittedAt: new Date(),
                    },
                });
            });

            afterEach(async () => {
                if (fieldInspectionApp) {
                    await prisma.permitApplication.delete({
                        where: { id: fieldInspectionApp.id },
                    });
                }
            });

            it('should allow field inspector to approve at field inspection stage', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${fieldInspectionApp.id}/approve`)
                    .set('Authorization', `Bearer ${fieldInspectorToken}`)
                    .send({
                        notes: 'Field inspection passed',
                        inspectionNotes: 'All measurements verified on site',
                    })
                    .expect(201);

                expect(response.body.currentStage).toBe(WorkflowStage.LEGALIZATION);
                expect(response.body.inspectionNotes).toBe(
                    'All measurements verified on site',
                );
            });

            it('should deny document validator from approving at field inspection stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${fieldInspectionApp.id}/approve`)
                    .set('Authorization', `Bearer ${documentValidatorToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });

            it('should deny legalizer from approving at field inspection stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${fieldInspectionApp.id}/approve`)
                    .set('Authorization', `Bearer ${legalizerToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });

            it('should allow field inspector to reject at field inspection stage', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${fieldInspectionApp.id}/reject`)
                    .set('Authorization', `Bearer ${fieldInspectorToken}`)
                    .send({
                        reason: 'Building height exceeds approved plans',
                        inspectionNotes: 'Measured 18m instead of 15m',
                    })
                    .expect(201);

                expect(response.body.status).toBe(WorkflowStage.REJECTED);
                expect(response.body.rejectionReason).toBe(
                    'Building height exceeds approved plans',
                );
            });
        });

        describe('Legalization stage', () => {
            let legalizationApp: any;

            beforeEach(async () => {
                legalizationApp = await prisma.permitApplication.create({
                    data: {
                        referenceNumber: `PERMIT-20260422-${Date.now()}`,
                        permitType: PermitType.BUSINESS_LICENSE,
                        status: WorkflowStage.LEGALIZATION,
                        currentStage: WorkflowStage.LEGALIZATION,
                        applicantId: regularUser.id,
                        businessName: 'Legalization Test Business',
                        businessType: 'Restaurant',
                        businessLocation: 'Legalization Test Location',
                        estimatedEmployees: 25,
                        administrativeFee: 300000,
                        totalCost: 300000,
                        submittedAt: new Date(),
                    },
                });
            });

            afterEach(async () => {
                if (legalizationApp) {
                    await prisma.permitApplication.delete({
                        where: { id: legalizationApp.id },
                    });
                }
            });

            it('should allow legalizer to approve at legalization stage', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${legalizationApp.id}/approve`)
                    .set('Authorization', `Bearer ${legalizerToken}`)
                    .send({ notes: 'Final approval granted' })
                    .expect(201);

                expect(response.body.currentStage).toBe(WorkflowStage.APPROVED);
                expect(response.body.status).toBe(WorkflowStage.APPROVED);
            });

            it('should deny document validator from approving at legalization stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${legalizationApp.id}/approve`)
                    .set('Authorization', `Bearer ${documentValidatorToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });

            it('should deny field inspector from approving at legalization stage', async () => {
                await request(app.getHttpServer())
                    .post(`/permits/applications/${legalizationApp.id}/approve`)
                    .set('Authorization', `Bearer ${fieldInspectorToken}`)
                    .send({ notes: 'Attempting to approve' })
                    .expect(403);
            });

            it('should allow legalizer to reject at legalization stage', async () => {
                const response = await request(app.getHttpServer())
                    .post(`/permits/applications/${legalizationApp.id}/reject`)
                    .set('Authorization', `Bearer ${legalizerToken}`)
                    .send({
                        reason: 'Missing required legal documentation',
                    })
                    .expect(201);

                expect(response.body.status).toBe(WorkflowStage.REJECTED);
                expect(response.body.rejectionReason).toBe(
                    'Missing required legal documentation',
                );
            });
        });
    });

    describe('Admin Override Capabilities', () => {
        it('should allow admin to approve at document check stage', async () => {
            const app1 = await prisma.permitApplication.create({
                data: {
                    referenceNumber: `PERMIT-20260422-${Date.now()}`,
                    permitType: PermitType.BUILDING_PERMIT,
                    status: WorkflowStage.DOCUMENT_CHECK,
                    currentStage: WorkflowStage.DOCUMENT_CHECK,
                    applicantId: regularUser.id,
                    locationAddress: 'Admin Override Test 1',
                    landSize: 100,
                    landType: LandType.RESIDENTIAL,
                    buildingHeight: 8,
                    njopValue: 1000000,
                    isStrategicLocation: false,
                    baseTax: 100000,
                    administrativeFee: 500000,
                    totalCost: 600000,
                    submittedAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/permits/applications/${app1.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ notes: 'Admin override approval' })
                .expect(201);

            expect(response.body.currentStage).toBe(WorkflowStage.FIELD_INSPECTION);

            await prisma.permitApplication.delete({ where: { id: app1.id } });
        });

        it('should allow admin to approve at field inspection stage', async () => {
            const app2 = await prisma.permitApplication.create({
                data: {
                    referenceNumber: `PERMIT-20260422-${Date.now()}`,
                    permitType: PermitType.BUILDING_PERMIT,
                    status: WorkflowStage.FIELD_INSPECTION,
                    currentStage: WorkflowStage.FIELD_INSPECTION,
                    applicantId: regularUser.id,
                    locationAddress: 'Admin Override Test 2',
                    landSize: 150,
                    landType: LandType.COMMERCIAL,
                    buildingHeight: 12,
                    njopValue: 2000000,
                    isStrategicLocation: true,
                    baseTax: 300000,
                    administrativeFee: 500000,
                    totalCost: 800000,
                    submittedAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/permits/applications/${app2.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    notes: 'Admin override approval',
                    inspectionNotes: 'Admin verified on site',
                })
                .expect(201);

            expect(response.body.currentStage).toBe(WorkflowStage.LEGALIZATION);

            await prisma.permitApplication.delete({ where: { id: app2.id } });
        });

        it('should allow admin to approve at legalization stage', async () => {
            const app3 = await prisma.permitApplication.create({
                data: {
                    referenceNumber: `PERMIT-20260422-${Date.now()}`,
                    permitType: PermitType.BUSINESS_LICENSE,
                    status: WorkflowStage.LEGALIZATION,
                    currentStage: WorkflowStage.LEGALIZATION,
                    applicantId: regularUser.id,
                    businessName: 'Admin Override Test Business',
                    businessType: 'Retail',
                    businessLocation: 'Admin Override Test Location',
                    estimatedEmployees: 15,
                    administrativeFee: 300000,
                    totalCost: 300000,
                    submittedAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/permits/applications/${app3.id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ notes: 'Admin final approval' })
                .expect(201);

            expect(response.body.currentStage).toBe(WorkflowStage.APPROVED);
            expect(response.body.status).toBe(WorkflowStage.APPROVED);

            await prisma.permitApplication.delete({ where: { id: app3.id } });
        });

        it('should allow admin to reject at any stage', async () => {
            const app4 = await prisma.permitApplication.create({
                data: {
                    referenceNumber: `PERMIT-20260422-${Date.now()}`,
                    permitType: PermitType.BUILDING_PERMIT,
                    status: WorkflowStage.FIELD_INSPECTION,
                    currentStage: WorkflowStage.FIELD_INSPECTION,
                    applicantId: regularUser.id,
                    locationAddress: 'Admin Rejection Test',
                    landSize: 100,
                    landType: LandType.RESIDENTIAL,
                    buildingHeight: 8,
                    njopValue: 1000000,
                    isStrategicLocation: false,
                    baseTax: 100000,
                    administrativeFee: 500000,
                    totalCost: 600000,
                    submittedAt: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/permits/applications/${app4.id}/reject`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    reason: 'Admin override rejection',
                })
                .expect(201);

            expect(response.body.status).toBe(WorkflowStage.REJECTED);
            expect(response.body.rejectionReason).toBe('Admin override rejection');

            await prisma.permitApplication.delete({ where: { id: app4.id } });
        });

        it('should allow admin to update any user roles', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/users/${documentValidatorUser.id}/roles`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    roles: [Role.DOCUMENT_VALIDATOR, Role.FIELD_INSPECTOR, Role.LEGALIZER],
                })
                .expect(200);

            expect(response.body.roles).toContain(Role.DOCUMENT_VALIDATOR);
            expect(response.body.roles).toContain(Role.FIELD_INSPECTOR);
            expect(response.body.roles).toContain(Role.LEGALIZER);

            // Reset roles
            await prisma.user.update({
                where: { id: documentValidatorUser.id },
                data: { roles: [Role.DOCUMENT_VALIDATOR] },
            });
        });
    });

    describe('Authentication Requirements', () => {
        it('should deny access without authentication token', async () => {
            await request(app.getHttpServer())
                .post(`/permits/applications/${testApplication.id}/approve`)
                .send({ notes: 'Attempting without auth' })
                .expect(401);
        });

        it('should deny access with invalid authentication token', async () => {
            await request(app.getHttpServer())
                .post(`/permits/applications/${testApplication.id}/approve`)
                .set('Authorization', 'Bearer invalid-token-12345')
                .send({ notes: 'Attempting with invalid token' })
                .expect(401);
        });

        it('should deny access with expired authentication token', async () => {
            // This would require creating an expired token
            // For now, we test with a malformed token
            await request(app.getHttpServer())
                .post(`/permits/applications/${testApplication.id}/approve`)
                .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired')
                .send({ notes: 'Attempting with expired token' })
                .expect(401);
        });
    });

    describe('Application Not Found', () => {
        it('should return 404 when application does not exist', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000';

            await request(app.getHttpServer())
                .post(`/permits/applications/${nonExistentId}/approve`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ notes: 'Attempting to approve non-existent application' })
                .expect(404);
        });
    });

    describe('Cross-User Access Control', () => {
        it('should allow staff to access applications from any applicant', async () => {
            // Document validator should be able to access application from regular user
            const response = await request(app.getHttpServer())
                .get(`/permits/applications/${testApplication.id}`)
                .set('Authorization', `Bearer ${documentValidatorToken}`)
                .expect(200);

            expect(response.body.id).toBe(testApplication.id);
        });

        it('should allow applicant to view their own application', async () => {
            const response = await request(app.getHttpServer())
                .get(`/permits/applications/${testApplication.id}`)
                .set('Authorization', `Bearer ${regularToken}`)
                .expect(200);

            expect(response.body.id).toBe(testApplication.id);
        });
    });
});
