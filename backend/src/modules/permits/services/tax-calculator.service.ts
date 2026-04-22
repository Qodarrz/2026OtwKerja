import { Injectable } from '@nestjs/common';
import { PermitType, LandType } from '@prisma/client';

export interface TaxCalculationInput {
    permitType: PermitType;
    landSize?: number;
    njopValue?: number;
    isStrategicLocation?: boolean;
    landType?: LandType;
    buildingHeight?: number;
    estimatedEmployees?: number;
}

export interface TaxBreakdownItem {
    label: string;
    amount: number;
    percentage?: number;
}

export interface TaxCalculationResult {
    baseTax: number;
    strategicSurcharge: number;
    landTypeSurcharge: number;
    highRiseSurcharge: number;
    administrativeFee: number;
    totalCost: number;
    breakdown: TaxBreakdownItem[];
}

@Injectable()
export class TaxCalculatorService {
    /**
     * Calculate all taxes and fees for a permit application
     */
    calculateTax(input: TaxCalculationInput): TaxCalculationResult {
        const baseTax = this.getBaseTax(input.njopValue || 0, input.landSize || 0);
        const strategicSurcharge = input.isStrategicLocation
            ? this.getStrategicSurcharge(baseTax)
            : 0;
        const landTypeSurcharge = input.landType
            ? this.getLandTypeSurcharge(baseTax, input.landType)
            : 0;
        const highRiseSurcharge = input.buildingHeight
            ? this.getHighRiseSurcharge(input.buildingHeight)
            : 0;
        const administrativeFee = this.getAdministrativeFee(input.permitType);

        const totalCost =
            baseTax +
            strategicSurcharge +
            landTypeSurcharge +
            highRiseSurcharge +
            administrativeFee;

        const breakdown: TaxBreakdownItem[] = [
            {
                label: 'Base Tax (NJOP × Land Size)',
                amount: baseTax,
            },
        ];

        if (strategicSurcharge > 0) {
            breakdown.push({
                label: 'Strategic Location Surcharge',
                amount: strategicSurcharge,
                percentage: 15,
            });
        }

        if (landTypeSurcharge > 0) {
            const percentage =
                input.landType === LandType.COMMERCIAL
                    ? 20
                    : input.landType === LandType.INDUSTRIAL
                        ? 15
                        : 0;
            breakdown.push({
                label: `${input.landType} Land Type Surcharge`,
                amount: landTypeSurcharge,
                percentage,
            });
        }

        if (highRiseSurcharge > 0) {
            breakdown.push({
                label: 'High-Rise Surcharge (>10m)',
                amount: highRiseSurcharge,
            });
        }

        breakdown.push({
            label: 'Administrative Fee',
            amount: administrativeFee,
        });

        return {
            baseTax,
            strategicSurcharge,
            landTypeSurcharge,
            highRiseSurcharge,
            administrativeFee,
            totalCost,
            breakdown,
        };
    }

    /**
     * Calculate base tax: njopValue × landSize × 0.001
     */
    getBaseTax(njopValue: number, landSize: number): number {
        return njopValue * landSize * 0.001;
    }

    /**
     * Calculate strategic location surcharge: baseTax × 0.15 (15%)
     */
    getStrategicSurcharge(baseTax: number): number {
        return baseTax * 0.15;
    }

    /**
     * Calculate land type surcharge based on land type
     * COMMERCIAL: 20%, INDUSTRIAL: 15%, others: 0%
     */
    getLandTypeSurcharge(baseTax: number, landType: LandType): number {
        switch (landType) {
            case LandType.COMMERCIAL:
                return baseTax * 0.2; // 20%
            case LandType.INDUSTRIAL:
                return baseTax * 0.15; // 15%
            case LandType.RESIDENTIAL:
            case LandType.AGRICULTURAL:
            default:
                return 0;
        }
    }

    /**
     * Calculate high-rise surcharge
     * Fixed 5,000,000 IDR if building height > 10m, otherwise 0
     */
    getHighRiseSurcharge(buildingHeight: number): number {
        return buildingHeight > 10 ? 5000000 : 0;
    }

    /**
     * Get administrative fee based on permit type
     * BUILDING_PERMIT: 500,000 IDR
     * BUSINESS_LICENSE: 300,000 IDR
     */
    getAdministrativeFee(permitType: PermitType): number {
        switch (permitType) {
            case PermitType.BUILDING_PERMIT:
                return 500000;
            case PermitType.BUSINESS_LICENSE:
                return 300000;
            default:
                return 0;
        }
    }
}
