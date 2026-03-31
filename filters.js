import { RAW_FOODS } from './foodData.js';

let enabledFoods = new Set(RAW_FOODS.map(f => f.name));

// Helper: check if a food has valid numeric stats
function isValidFood(food) {
    return typeof food.carbs === 'number' && !isNaN(food.carbs) &&
           typeof food.protein === 'number' && !isNaN(food.protein) &&
           typeof food.fat === 'number' && !isNaN(food.fat) &&
           typeof food.vitamins === 'number' && !isNaN(food.vitamins) &&
           typeof food.cal === 'number' && !isNaN(food.cal);
}

export function getEnabledFoods() {
    return new Set(enabledFoods);
}

export function setEnabledFoods(set) {
    enabledFoods = set;
}

export function toggleFood(name, enable) {
    if (enable) enabledFoods.add(name);
    else enabledFoods.delete(name);
}

export function isEnabled(name) {
    return enabledFoods.has(name);
}

export function getAllFoods() {
    // Return only valid foods
    return RAW_FOODS.filter(isValidFood);
}

export function getFilteredFoods() {
    const tierSelect = document.getElementById('tier');
    const disableTier = document.getElementById('disableTierFilter').checked;
    const biomeSelect = document.getElementById('biomeFilter');
    const disableBiome = document.getElementById('disableBiomeFilter').checked;
    const tier = tierSelect ? tierSelect.value : 'all';
    const biome = biomeSelect ? biomeSelect.value : 'all';

    return RAW_FOODS.filter(food => {
        // First, ensure the food is valid and enabled
        if (!isValidFood(food)) return false;
        if (!enabledFoods.has(food.name)) return false;
        // Apply tier filter
        if (!disableTier && tier !== 'all' && food.tier !== tier) return false;
        // Apply biome filter
        if (!disableBiome && biome !== 'all' && !food.biomes.includes(biome) && !food.biomes.includes('any')) return false;
        return true;
    });
}
