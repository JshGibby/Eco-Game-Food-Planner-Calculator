import { getFilteredFoods, toggleFood, isEnabled, getAllFoods, setEnabledFoods } from './filters.js';
import { generateOptimalPlans, generateRandomPlanOnly } from './planGenerator.js';
import { drawPie, displayPlan } from './ui.js';

// Cached plans and current index
let cachedPlans = null;
let currentPlanIndex = -1;

function getCurrentNutrients() {
    return {
        carbs: parseFloat(document.getElementById('carbs').value) || 0,
        protein: parseFloat(document.getElementById('protein').value) || 0,
        fat: parseFloat(document.getElementById('fat').value) || 0,
        vitamins: parseFloat(document.getElementById('vitamins').value) || 0
    };
}

function updateTotalPoints() {
    const nutrients = getCurrentNutrients();
    const total = nutrients.carbs + nutrients.protein + nutrients.fat + nutrients.vitamins;
    const totalSpan = document.getElementById('totalPointsValue');
    if (totalSpan) totalSpan.textContent = total;
}

function getCurrentCalories() {
    return parseFloat(document.getElementById('curCalories').value) || 0;
}

function getMaxCalories() {
    return parseFloat(document.getElementById('maxCalories').value) || 3000;
}

function getIgnoreLimit() {
    return document.getElementById('ignoreCalorieLimit').checked;
}

function getMaxDistinct() {
    const slider = document.getElementById('maxDistinctSlider');
    return slider ? parseInt(slider.value, 10) : 10;
}

function getMaxServingsPerFood() {
    const slider = document.getElementById('maxServingsSlider');
    return slider ? parseInt(slider.value, 10) : 10;
}

function getTolerance() {
    const slider = document.getElementById('toleranceSlider');
    return slider ? parseInt(slider.value, 10) : 100;
}

function updateSliderDisplay() {
    const maxDistinctSlider = document.getElementById('maxDistinctSlider');
    const maxDistinctValue = document.getElementById('maxDistinctValue');
    if (maxDistinctSlider && maxDistinctValue) {
        maxDistinctValue.textContent = maxDistinctSlider.value;
    }
    const maxServingsSlider = document.getElementById('maxServingsSlider');
    const maxServingsValue = document.getElementById('maxServingsValue');
    if (maxServingsSlider && maxServingsValue) {
        maxServingsValue.textContent = maxServingsSlider.value;
    }
    const toleranceSlider = document.getElementById('toleranceSlider');
    const toleranceValue = document.getElementById('toleranceValue');
    if (toleranceSlider && toleranceValue) {
        toleranceValue.textContent = `≤${toleranceSlider.value}`;
    }
}

// Invalidate cached plans when any relevant input changes
function invalidateCache() {
    cachedPlans = null;
    currentPlanIndex = -1;
    const planCounter = document.getElementById('planCounter');
    if (planCounter) planCounter.textContent = '';
}

async function generateAndShowOptimalPlan() {
    const current = getCurrentNutrients();
    const curCal = getCurrentCalories();
    const maxCal = getMaxCalories();
    const ignoreLimit = getIgnoreLimit();
    const maxDistinct = getMaxDistinct();
    const maxServings = getMaxServingsPerFood();
    const tolerance = getTolerance();
    
    const calcBtn = document.getElementById('calculateBtn');
    const originalText = calcBtn.textContent;
    
    // If we have cached plans and index is within range, just cycle
    if (cachedPlans && cachedPlans.length > 0 && currentPlanIndex >= 0) {
        currentPlanIndex = (currentPlanIndex + 1) % cachedPlans.length;
        displayPlan(cachedPlans[currentPlanIndex], current);
        updatePlanCounter();
        return;
    }
    
    // Otherwise generate new perfect plans
    calcBtn.textContent = '⚡ Generating...';
    calcBtn.disabled = true;
    
    setTimeout(() => {
        try {
            const plans = generateOptimalPlans(current, curCal, maxCal, ignoreLimit, maxDistinct, maxServings, tolerance, 50, 50000);
            if (plans.length === 0) {
                const diff = Math.max(current.carbs, current.protein, current.fat, current.vitamins) -
                             Math.min(current.carbs, current.protein, current.fat, current.vitamins);
                const caloriesAtCap = ignoreLimit || curCal >= maxCal - 10;
                if (diff <= tolerance && caloriesAtCap) {
                    const emptyPlan = {
                        meals: [],
                        final: { ...current },
                        caloriesUsed: 0,
                        diff: diff
                    };
                    displayPlan(emptyPlan, current);
                    const mealListDiv = document.getElementById('mealList');
                    if (mealListDiv) {
                        mealListDiv.innerHTML = `✨ Your current nutrient balance is already within ${tolerance} points and calories are maxed out! No additional food needed.`;
                    }
                    cachedPlans = null;
                    currentPlanIndex = -1;
                    const planCounter = document.getElementById('planCounter');
                    if (planCounter) planCounter.textContent = '';
                } else {
                    alert(`❌ No meal plan found with nutrient difference ≤ ${tolerance} points.\nTry enabling more foods, increasing max distinct items, or adjusting your current stats.`);
                }
                calcBtn.textContent = originalText;
                calcBtn.disabled = false;
                return;
            }
            cachedPlans = plans;
            currentPlanIndex = 0;
            displayPlan(cachedPlans[0], current);
            updatePlanCounter();
        } catch (err) {
            console.error(err);
            alert('An error occurred while generating the optimal plan.');
        } finally {
            calcBtn.textContent = originalText;
            calcBtn.disabled = false;
        }
    }, 10);
}

function updatePlanCounter() {
    const counterSpan = document.getElementById('planCounter');
    if (counterSpan && cachedPlans && cachedPlans.length > 0) {
        counterSpan.textContent = `Plan ${currentPlanIndex + 1}/${cachedPlans.length} (diff ≤${getTolerance()})`;
    } else if (counterSpan) {
        counterSpan.textContent = '';
    }
}

function generateRandomPlan() {
    const current = getCurrentNutrients();
    const curCal = getCurrentCalories();
    const maxCal = getMaxCalories();
    const ignoreLimit = getIgnoreLimit();
    const maxDistinct = getMaxDistinct();
    const maxServings = getMaxServingsPerFood();
    const plan = generateRandomPlanOnly(current, curCal, maxCal, ignoreLimit, maxDistinct, maxServings);
    if (plan) {
        displayPlan(plan, current);
        if (plan.meals.length === 0) {
            const mealListDiv = document.getElementById('mealList');
            if (mealListDiv) {
                mealListDiv.innerHTML = `✨ Your current nutrient balance is already within 2 points and calories are maxed out! No additional food needed.`;
            }
        }
        // Random plan resets the optimal cache
        cachedPlans = null;
        currentPlanIndex = -1;
        const counterSpan = document.getElementById('planCounter');
        if (counterSpan) counterSpan.textContent = '';
    } else {
        alert('No foods available to generate a random plan.');
    }
}

function buildFoodUI() {
    const container = document.getElementById('foodListContainer');
    const searchInput = document.getElementById('foodSearch');
    if (!container) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const foods = getAllFoods().filter(f => f.name.toLowerCase().includes(searchTerm));
    container.innerHTML = '';
    for (const food of foods) {
        const div = document.createElement('div');
        div.className = 'food-item';
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = isEnabled(food.name);
        cb.onchange = (e) => {
            toggleFood(food.name, e.target.checked);
            const toggleAll = document.getElementById('toggleAllFoods');
            if (toggleAll) toggleAll.checked = getAllFoods().every(f => isEnabled(f.name));
            invalidateCache();
        };
        
        const statsSpan = document.createElement('span');
        statsSpan.className = 'food-stats';
        statsSpan.textContent = `C${food.carbs} P${food.protein} F${food.fat} V${food.vitamins} | ${food.cal}cal`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'food-name';
        nameSpan.textContent = food.name;
        
        div.appendChild(cb);
        div.appendChild(statsSpan);
        div.appendChild(nameSpan);
        container.appendChild(div);
    }
}

function initEventListeners() {
    // Slider events
    const maxDistinctSlider = document.getElementById('maxDistinctSlider');
    if (maxDistinctSlider) {
        maxDistinctSlider.addEventListener('input', () => {
            updateSliderDisplay();
            invalidateCache();
        });
    }
    const maxServingsSlider = document.getElementById('maxServingsSlider');
    if (maxServingsSlider) {
        maxServingsSlider.addEventListener('input', () => {
            updateSliderDisplay();
            invalidateCache();
        });
    }
    const toleranceSlider = document.getElementById('toleranceSlider');
    if (toleranceSlider) {
        toleranceSlider.addEventListener('input', () => {
            updateSliderDisplay();
            invalidateCache();
        });
    }
    updateSliderDisplay();
    
    // All inputs that affect plan generation should invalidate cache
    const cacheInvalidatingIds = ['carbs', 'protein', 'fat', 'vitamins', 'curCalories', 'maxCalories', 'ignoreCalorieLimit', 'tier', 'disableTierFilter', 'biomeFilter', 'disableBiomeFilter'];
    cacheInvalidatingIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                invalidateCache();
                const nutrients = getCurrentNutrients();
                drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                updateTotalPoints();
            });
            if (el.type === 'number') {
                el.addEventListener('input', () => {
                    invalidateCache();
                    const nutrients = getCurrentNutrients();
                    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                    updateTotalPoints();
                });
            }
        }
    });
    
    document.getElementById('toggleFoodPanelBtn').onclick = () => {
        const panel = document.getElementById('foodPanel');
        if (panel) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                buildFoodUI();
            } else {
                panel.style.display = 'none';
            }
        }
    };
    document.getElementById('toggleAllFoods').onchange = (e) => {
        const enabled = e.target.checked;
        const allFoods = getAllFoods();
        const newSet = new Set();
        allFoods.forEach(f => { if (enabled) newSet.add(f.name); });
        setEnabledFoods(newSet);
        buildFoodUI();
        invalidateCache();
    };
    document.getElementById('foodSearch').oninput = () => buildFoodUI();
    document.getElementById('calculateBtn').onclick = generateAndShowOptimalPlan;
    document.getElementById('randomizeBtn').onclick = generateRandomPlan;
    
    const nutrients = getCurrentNutrients();
    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    drawPie('afterChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    updateTotalPoints();
    buildFoodUI();
}

initEventListeners();
