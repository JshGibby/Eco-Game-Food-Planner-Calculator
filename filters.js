import { RAW_FOODS } from './foodData.js';

let enabledFoods = new Set(RAW_FOODS.map(f => f.name));

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
    return RAW_FOODS;
}

export function getFilteredFoods() {
    const tierSelect = document.getElementById('tier');
    const disableTier = document.getElementById('disableTierFilter').checked;
    const biomeSelect = document.getElementById('biomeFilter');
    const disableBiome = document.getElementById('disableBiomeFilter').checked;
    const tier = tierSelect ? tierSelect.value : 'all';
    const biome = biomeSelect ? biomeSelect.value : 'all';

    return RAW_FOODS.filter(food => {
        if (!enabledFoods.has(food.name)) return false;
        if (!disableTier && tier !== 'all' && food.tier !== tier) return false;
        if (!disableBiome && biome !== 'all' && !food.biomes.includes(biome) && !food.biomes.includes('any')) return false;
        return true;
    });
}
