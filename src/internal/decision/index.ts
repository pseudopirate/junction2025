export async function predictMigraneRisk(sample: Record<string, number | string>) {
    console.log(sample);
    return Promise.resolve({
        score: 0.5,
        meta: {
            explanation: 'This is a test explanation',
        }
    })
}