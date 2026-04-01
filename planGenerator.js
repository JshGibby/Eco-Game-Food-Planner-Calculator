import { getFilteredFoods } from './filters.js';

// Helper: check if nutrient values are balanced within a given tolerance
function isBalanced(nutrients, tolerance) {
    const vals = [nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins];
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);
    return (maxVal - minVal) <= tolerance;
}

function computePlanTotals(plan, currentNutrients) {
    const totals = { 
        carbs: currentNutrients.carbs, 
        protein: currentNutrients.protein, 
        fat: currentNutrients.fat, 
        vitamins: currentNutrients.vitamins, 
        calories: 0 
    };
    for (const item of plan) {
        if (!item || !item.food) continue;
        const s = item.servings || 0;
        totals.carbs += (item.food.carbs || 0) * s;
        totals.protein += (item.food.protein || 0) * s;
        totals.fat += (item.food.fat || 0) * s;
        totals.vitamins += (item.food.vitamins || 0) * s;
        totals.calories += (item.food.cal || 0) * s;
    }
    return totals;
}

function generateRandomPlan(availableFoods, maxCalories, ignoreLimit, maxDistinct = 4, maxServingsPerFood = 3) {
    const plan = [];
    let remainingCal = ignoreLimit ? 1e9 : maxCalories;
    const usedFoods = new Set();
    
    const shuffled = [...availableFoods];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    for (const food of shuffled) {
        if (usedFoods.size >= maxDistinct) break;
        if (!ignoreLimit && food.cal <= 0) continue;
        if (food.cal > remainingCal && !ignoreLimit) continue;
        const maxS = ignoreLimit ? maxServingsPerFood : Math.min(maxServingsPerFood, Math.floor(remainingCal / food.cal));
        if (maxS < 1) continue;
        const servings = Math.floor(Math.random() * maxS) + 1;
        plan.push({ food, servings });
        remainingCal -= food.cal * servings;
        usedFoods.add(food);
    }
    return plan;
}

function evaluatePlan(plan, currentNutrients) {
    const totals = computePlanTotals(plan, currentNutrients);
    const maxVal = Math.max(totals.carbs, totals.protein, totals.fat, totals.vitamins);
    const minVal = Math.min(totals.carbs, totals.protein, totals.fat, totals.vitamins);
    const diff = maxVal - minVal;
    return { totals, diff, caloriesUsed: totals.calories };
}

export function generateOptimalPlans(currentNutrients, currentCalories, maxCalories, ignoreLimit, maxDistinct = 4, maxServingsPerFood = 3, tolerance = 2, numPlans = 50, iterations = 20000) {
    // If current state is already within tolerance and calories are maxed, return empty
    const balanced = isBalanced(currentNutrients, tolerance);
    const caloriesAtCap = ignoreLimit || currentCalories >= maxCalories - 10;
    if (balanced && caloriesAtCap) {
        return [];
    }
    
    const available = getFilteredFoods();
    if (available.length === 0) return [];
    
    const candidatePlans = [];
    
    for (let i = 0; i < iterations; i++) {
        const plan = generateRandomPlan(available, maxCalories - currentCalories, ignoreLimit, maxDistinct, maxServingsPerFood);
        if (plan.length === 0) continue;
        const { totals, diff, caloriesUsed } = evaluatePlan(plan, currentNutrients);
        if (isNaN(totals.carbs) || isNaN(totals.protein) || isNaN(totals.fat) || isNaN(totals.vitamins)) continue;
        // Only keep plans that meet the tolerance
        if (diff <= tolerance) {
            candidatePlans.push({
                meals: plan,
                final: { carbs: totals.carbs, protein: totals.protein, fat: totals.fat, vitamins: totals.vitamins },
                caloriesUsed,
                diff
            });
        }
    }
    
    // Remove duplicates based on meal composition
    const unique = new Map();
    for (const plan of candidatePlans) {
        const key = plan.meals.map(m => `${m.food.name}x${m.servings}`).sort().join('|');
        if (!unique.has(key) || unique.get(key).caloriesUsed < plan.caloriesUsed) {
            unique.set(key, plan);
        }
    }
    
    // Sort by calories used descending (higher = better) to maximize calorie filling
    const sorted = Array.from(unique.values()).sort((a, b) => b.caloriesUsed - a.caloriesUsed);
    
    return sorted.slice(0, numPlans);
}

export function generateRandomPlanOnly(currentNutrients, currentCalories, maxCalories, ignoreLimit, maxDistinct = 4, maxServingsPerFood = 3) {
    const available = getFilteredFoods();
    if (available.length === 0) return null;
    
    // For random, we still use a fixed tolerance of 2 for "already perfect" check? Keep consistent.
    const balanced = isBalanced(currentNutrients, 2);
    const caloriesAtCap = ignoreLimit || currentCalories >= maxCalories - 10;
    if (balanced && caloriesAtCap) {
        return {
            meals: [],
            final: { ...currentNutrients },
            caloriesUsed: 0,
            diff: Math.max(currentNutrients.carbs, currentNutrients.protein, currentNutrients.fat, currentNutrients.vitamins) -
                   Math.min(currentNutrients.carbs, currentNutrients.protein, currentNutrients.fat, currentNutrients.vitamins)
        };
    }
    
    const plan = generateRandomPlan(available, maxCalories - currentCalories, ignoreLimit, maxDistinct, maxServingsPerFood);
    const { totals, diff, caloriesUsed } = evaluatePlan(plan, currentNutrients);
    return {
        meals: plan,
        final: { carbs: totals.carbs, protein: totals.protein, fat: totals.fat, vitamins: totals.vitamins },
        caloriesUsed,
        diff
    };
}
