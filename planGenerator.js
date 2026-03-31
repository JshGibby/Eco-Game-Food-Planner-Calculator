import { getFilteredFoods } from './filters.js';

function computePlanTotals(plan, currentNutrients) {
    const totals = { carbs: currentNutrients.carbs, protein: currentNutrients.protein, fat: currentNutrients.fat, vitamins: currentNutrients.vitamins, calories: 0 };
    for (const item of plan) {
        totals.carbs += item.food.carbs * item.servings;
        totals.protein += item.food.protein * item.servings;
        totals.fat += item.food.fat * item.servings;
        totals.vitamins += item.food.vitamins * item.servings;
        totals.calories += item.food.cal * item.servings;
    }
    return totals;
}

function generateRandomPlan(availableFoods, maxCalories, ignoreLimit, maxDistinct = 8, maxServingsPerFood = 3) {
    const plan = [];
    let remainingCal = ignoreLimit ? 1e9 : maxCalories;
    const usedFoods = new Set();
    
    // Shuffle available foods for randomness
    const shuffled = [...availableFoods];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    for (const food of shuffled) {
        if (usedFoods.size >= maxDistinct) break;
        if (food.cal > remainingCal && !ignoreLimit) continue;
        
        // Determine servings: random between 1 and max allowed
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

export function generateOptimalPlans(currentNutrients, maxCalories, ignoreLimit, numPlans = 20, iterations = 8000) {
    const available = getFilteredFoods();
    if (available.length === 0) return [];
    
    const candidatePlans = [];
    
    for (let i = 0; i < iterations; i++) {
        const plan = generateRandomPlan(available, maxCalories, ignoreLimit);
        if (plan.length === 0) continue;
        const { totals, diff, caloriesUsed } = evaluatePlan(plan, currentNutrients);
        candidatePlans.push({
            meals: plan,
            final: { carbs: totals.carbs, protein: totals.protein, fat: totals.fat, vitamins: totals.vitamins },
            caloriesUsed,
            diff
        });
    }
    
    // Remove duplicates based on meal composition (simple string key)
    const unique = new Map();
    for (const plan of candidatePlans) {
        const key = plan.meals.map(m => `${m.food.name}x${m.servings}`).sort().join('|');
        if (!unique.has(key) || unique.get(key).diff > plan.diff) {
            unique.set(key, plan);
        }
    }
    
    // Convert to array and sort by diff (ascending), then by caloriesUsed (descending)
    const sorted = Array.from(unique.values()).sort((a, b) => {
        if (Math.abs(a.diff - b.diff) < 0.1) return b.caloriesUsed - a.caloriesUsed;
        return a.diff - b.diff;
    });
    
    return sorted.slice(0, numPlans);
}

export function generateRandomPlanOnly(currentNutrients, maxCalories, ignoreLimit) {
    const available = getFilteredFoods();
    if (available.length === 0) return null;
    const plan = generateRandomPlan(available, maxCalories, ignoreLimit, 10, 5);
    const { totals, diff, caloriesUsed } = evaluatePlan(plan, currentNutrients);
    return {
        meals: plan,
        final: { carbs: totals.carbs, protein: totals.protein, fat: totals.fat, vitamins: totals.vitamins },
        caloriesUsed,
        diff
    };
}