import { getFilteredFoods, toggleFood, isEnabled, getAllFoods, setEnabledFoods } from './filters.js';
import { generateOptimalPlans, generateRandomPlanOnly } from './planGenerator.js';
import { drawPie, displayPlan } from './ui.js';

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
    return slider ? parseInt(slider.value, 10) : 4;
}

// Update slider display
function updateSliderDisplay() {
    const slider = document.getElementById('maxDistinctSlider');
    const display = document.getElementById('maxDistinctValue');
    if (slider && display) {
        display.textContent = slider.value;
    }
}

async function generateAndShowOptimalPlan() {
    const current = getCurrentNutrients();
    const curCal = getCurrentCalories();
    const maxCal = getMaxCalories();
    const ignoreLimit = getIgnoreLimit();
    const maxDistinct = getMaxDistinct();
    
    const calcBtn = document.getElementById('calculateBtn');
    const originalText = calcBtn.textContent;
    calcBtn.textContent = '⚡ Generating...';
    calcBtn.disabled = true;
    
    setTimeout(() => {
        try {
            const plans = generateOptimalPlans(current, curCal, maxCal, ignoreLimit, maxDistinct, 1, 10000);
            if (plans.length === 0) {
                const diff = Math.max(current.carbs, current.protein, current.fat, current.vitamins) -
                             Math.min(current.carbs, current.protein, current.fat, current.vitamins);
                const caloriesAtCap = ignoreLimit || curCal >= maxCal - 10;
                if (diff <= 2 && caloriesAtCap) {
                    const emptyPlan = {
                        meals: [],
                        final: { ...current },
                        caloriesUsed: 0,
                        diff: diff
                    };
                    displayPlan(emptyPlan, current);
                    const mealListDiv = document.getElementById('mealList');
                    if (mealListDiv) {
                        mealListDiv.innerHTML = '✨ Your current nutrient balance is already perfect (difference ≤2) and calories are maxed out! No additional food needed.';
                    }
                } else {
                    alert('No suitable plan found with difference ≤2 points. Try enabling more foods or adjusting stats.');
                }
                calcBtn.textContent = originalText;
                calcBtn.disabled = false;
                return;
            }
            displayPlan(plans[0], current);
        } catch (err) {
            console.error(err);
            alert('An error occurred while generating the optimal plan.');
        } finally {
            calcBtn.textContent = originalText;
            calcBtn.disabled = false;
        }
    }, 10);
}

function generateRandomPlan() {
    const current = getCurrentNutrients();
    const curCal = getCurrentCalories();
    const maxCal = getMaxCalories();
    const ignoreLimit = getIgnoreLimit();
    const maxDistinct = getMaxDistinct();
    const plan = generateRandomPlanOnly(current, curCal, maxCal, ignoreLimit, maxDistinct);
    if (plan) {
        displayPlan(plan, current);
        if (plan.meals.length === 0) {
            const mealListDiv = document.getElementById('mealList');
            if (mealListDiv) {
                mealListDiv.innerHTML = '✨ Your current nutrient balance is already perfect (difference ≤2) and calories are maxed out! No additional food needed.';
            }
        }
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
    // Slider event
    const slider = document.getElementById('maxDistinctSlider');
    if (slider) {
        slider.addEventListener('input', updateSliderDisplay);
        updateSliderDisplay();
    }
    
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
    };
    document.getElementById('foodSearch').oninput = () => buildFoodUI();
    document.getElementById('calculateBtn').onclick = generateAndShowOptimalPlan;
    document.getElementById('randomizeBtn').onclick = generateRandomPlan;
    
    const inputs = ['carbs', 'protein', 'fat', 'vitamins', 'curCalories', 'maxCalories', 'ignoreCalorieLimit', 'tier', 'disableTierFilter', 'biomeFilter', 'disableBiomeFilter'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                const nutrients = getCurrentNutrients();
                drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                updateTotalPoints();
            });
            if (el.type === 'number') {
                el.addEventListener('input', () => {
                    const nutrients = getCurrentNutrients();
                    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                    updateTotalPoints();
                });
            }
        }
    });
    
    const nutrients = getCurrentNutrients();
    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    drawPie('afterChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    updateTotalPoints();
    buildFoodUI();
}

initEventListeners();
