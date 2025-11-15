import type { GeneralData } from '../storage';
import { model } from './model';


/* eslint-disable */
function predictWithTree(tree: any, sample: any) {
    // Leaf node
    if (tree.value) {
      const [neg, pos] = tree.value;
      return pos / (neg + pos);
    }
  
    // Split
    const featureValue = sample[tree.feature];
    if (featureValue <= tree.threshold) {
      return predictWithTree(tree.left, sample);
    } else {
      return predictWithTree(tree.right, sample);
    }
  }

export async function predictMigraneRisk(sample: GeneralData) {
    const score = predictWithTree(model, sample);

    return Promise.resolve({
        score,
        meta: {
            explanation: 'This is a test explanation',
        }
    })
}