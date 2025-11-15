import type { GeneralData } from '../storage';
import { storage } from '../storage';
import { model } from './model';

interface Feature {
    label: string
    value: number
    threshold: number
    direction: 'left' | 'right' // which branch was taken
}

interface Trend {
    feature: string
    current: number
    average: number
    trend: 'increasing' | 'decreasing' | 'stable'
    changePercent: number
}

interface Explanation {
    summary: string
    keyFactors: string[]
    trends: Trend[]
    recommendations: string[]
}

/* eslint-disable */
function predictWithTree(tree: any, sample: any, features: Feature[]) {
    // Leaf node
    if (tree.value) {
      const [neg, pos] = tree.value;
      return pos / (neg + pos);
    }
  
    const featureValue = sample[tree.feature];
    const direction = featureValue <= tree.threshold ? 'left' : 'right';
    
    features.push({
        label: tree.feature,
        value: featureValue,
        threshold: tree.threshold,
        direction,
    })

    // Split
    if (featureValue <= tree.threshold) {
      return predictWithTree(tree.left, sample, features);
    } else {
      return predictWithTree(tree.right, sample, features);
    }
  }

/**
 * Get historical data for trend analysis
 */
async function getHistoricalData(hours: number = 24): Promise<GeneralData[]> {
    try {
        const allItems = await storage.readAll<GeneralData>('general');
        const now = Date.now();
        const cutoffTime = now - (hours * 60 * 60 * 1000);
        
        // Filter items from the last N hours and sort by date
        const recentItems = allItems
            .filter(item => item.createdAt >= cutoffTime)
            .map(item => item.data)
            .filter(data => data && data.date)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        return recentItems;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

/**
 * Calculate trends for features used in the decision path
 */
function calculateTrends(
    current: GeneralData,
    historical: GeneralData[],
    features: Feature[]
): Trend[] {
    if (historical.length === 0) {
        return features.map(f => ({
            feature: f.label,
            current: f.value,
            average: f.value,
            trend: 'stable' as const,
            changePercent: 0,
        }));
    }

    const trends: Trend[] = [];
    const uniqueFeatures = new Set(features.map(f => f.label));

    for (const featureName of uniqueFeatures) {
        const currentValue = current[featureName as keyof GeneralData] as number;
        const historicalValues = historical
            .map(h => h[featureName as keyof GeneralData] as number)
            .filter(v => typeof v === 'number' && !isNaN(v));

        if (historicalValues.length === 0) {
            trends.push({
                feature: featureName,
                current: currentValue,
                average: currentValue,
                trend: 'stable',
                changePercent: 0,
            });
            continue;
        }

        const average = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
        const changePercent = average !== 0 
            ? ((currentValue - average) / Math.abs(average)) * 100 
            : 0;

        let trend: 'increasing' | 'decreasing' | 'stable';
        if (Math.abs(changePercent) < 5) {
            trend = 'stable';
        } else if (changePercent > 0) {
            trend = 'increasing';
        } else {
            trend = 'decreasing';
        }

        trends.push({
            feature: featureName,
            current: currentValue,
            average,
            trend,
            changePercent: Math.round(changePercent * 10) / 10,
        });
    }

    return trends;
}

/**
 * Generate explanation based on features, score, and trends
 */
function generateExplanation(
    score: number,
    features: Feature[],
    trends: Trend[]
): Explanation {
    const keyFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Feature descriptions for better explanations
    const featureDescriptions: Record<string, string> = {
        sleep_hours: 'sleep hours',
        screen_time_hours: 'screen time',
        prodrome_symptoms: 'prodrome symptoms',
        stress_level: 'stress level',
        attacks_last_7_days: 'recent attacks (7 days)',
        attacks_last_30_days: 'recent attacks (30 days)',
        days_since_last_attack: 'days since last attack',
        hydration_low: 'low hydration',
        skipped_meal: 'skipped meals',
        bright_light_exposure: 'bright light exposure',
        pressure_drop: 'pressure drop',
    };

    // Analyze each feature in the path
    for (const feature of features) {
        const featureName = featureDescriptions[feature.label] || feature.label;
        const trend = trends.find(t => t.feature === feature.label);
        
        // Determine if this feature contributes to high risk
        let isProblematic = false;
        let reason = '';

        // Sleep hours - lower is worse
        if (feature.label === 'sleep_hours') {
            if (feature.value <= feature.threshold) {
                isProblematic = true;
                reason = `You're getting only ${feature.value.toFixed(1)} hours of sleep, below the recommended ${feature.threshold.toFixed(1)} hours`;
            }
        }
        // Screen time - higher is worse
        else if (feature.label === 'screen_time_hours') {
            if (feature.value > feature.threshold) {
                isProblematic = true;
                reason = `Your screen time is ${feature.value.toFixed(1)} hours, above the recommended ${feature.threshold.toFixed(1)} hours`;
            }
        }
        // Prodrome symptoms - higher is worse
        else if (feature.label === 'prodrome_symptoms') {
            if (feature.value > feature.threshold) {
                isProblematic = true;
                reason = `You're experiencing prodrome symptoms`;
            }
        }
        // Stress level - higher is worse
        else if (feature.label === 'stress_level') {
            if (feature.value > feature.threshold) {
                isProblematic = true;
                reason = `Your stress level appears elevated`;
            }
        }
        // Attacks - higher is worse
        else if (feature.label === 'attacks_last_7_days' || feature.label === 'attacks_last_30_days') {
            if (feature.value > feature.threshold) {
                isProblematic = true;
                reason = `You've had ${feature.value} ${feature.label.includes('7') ? 'recent' : ''} attacks`;
            }
        }
        // Days since last attack - lower is worse
        else if (feature.label === 'days_since_last_attack') {
            if (feature.value <= feature.threshold) {
                isProblematic = true;
                reason = `It has been ${feature.value} days since your last attack`;
            }
        }
        // Hydration - higher is worse (hydration_low means low hydration)
        else if (feature.label === 'hydration_low') {
            if (feature.value > feature.threshold) {
                isProblematic = true;
                reason = `You're experiencing low hydration`;
            }
        }

        if (isProblematic) {
            keyFactors.push(reason);
            
            // Add trend information if available
            if (trend && Math.abs(trend.changePercent) > 10) {
                if (trend.trend === 'increasing' && (feature.label === 'screen_time_hours' || feature.label === 'stress_level' || feature.label === 'prodrome_symptoms')) {
                    keyFactors.push(`Your ${featureName} has increased compared to recent averages`);
                } else if (trend.trend === 'decreasing' && feature.label === 'sleep_hours') {
                    keyFactors.push(`Your ${featureName} has decreased compared to recent averages`);
                }
            }
        }
    }

    // Generate recommendations based on problematic features
    const problematicFeatures = features.filter(f => {
        if (f.label === 'sleep_hours' && f.value <= f.threshold) return true;
        if (f.label === 'screen_time_hours' && f.value > f.threshold) return true;
        if (f.label === 'prodrome_symptoms' && f.value > f.threshold) return true;
        if (f.label === 'stress_level' && f.value > f.threshold) return true;
        if (f.label === 'hydration_low' && f.value > f.threshold) return true;
        return false;
    });

    for (const feature of problematicFeatures) {
        if (feature.label === 'sleep_hours') {
            recommendations.push(`Aim for at least ${feature.threshold.toFixed(1)} hours of sleep per night`);
        } else if (feature.label === 'screen_time_hours') {
            recommendations.push(`Reduce screen time to below ${feature.threshold.toFixed(1)} hours per day`);
        } else if (feature.label === 'prodrome_symptoms') {
            recommendations.push('Monitor and manage prodrome symptoms early');
        } else if (feature.label === 'stress_level') {
            recommendations.push('Practice stress-reduction techniques');
        } else if (feature.label === 'hydration_low') {
            recommendations.push('Increase your water intake throughout the day');
        }
    }

    // Generate summary
    const riskLevel = score >= 0.7 ? 'high' : score >= 0.4 ? 'moderate' : 'low';
    let summary = `Your migraine risk is ${riskLevel}. `;
    
    if (keyFactors.length > 0) {
        summary += `Main contributing factors: ${keyFactors.slice(0, 3).join(', ')}.`;
    } else {
        summary += `Your current metrics are within normal ranges.`;
    }

    return {
        summary,
        keyFactors,
        trends,
        recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring your health metrics'],
    };
}

export async function predictMigraneRisk(
    sample: GeneralData,
    includeTrends: boolean = true
) {
    const features: Feature[] = [];
    const score = predictWithTree(model, sample, features);

    let trends: Trend[] = [];
    let explanation: Explanation | null = null;

    if (includeTrends) {
        // Get historical data (last 24 hours by default, but can extend to 7 days for better trends)
        const historical = await getHistoricalData(24 * 7); // Last 7 days
        trends = calculateTrends(sample, historical, features);
        explanation = generateExplanation(score, features, trends);
    } else {
        // Basic explanation without trends
        explanation = generateExplanation(score, features, []);
    }

    return Promise.resolve({
        score,
        meta: {
            explanation: explanation?.summary || 'Unable to generate explanation',
            detailedExplanation: explanation,
            features: features.map(f => ({
                label: f.label,
                value: f.value,
                threshold: f.threshold,
                direction: f.direction,
                isAboveThreshold: f.direction === 'right',
            })),
            trends,
        }
    });
}