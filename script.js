import { getFilteredFoods, toggleFood, isEnabled, getAllFoods, setEnabledFoods } from './filters.js';
import { generateOptimalPlans, generateRandomPlanOnly } from './planGenerator.js';
import { drawPie, displayPlan, renderPlanList } from './ui.js';

let currentOptimalPlans = [];
let selectedPlanIndex = -1;

function getCurrentNutrients() {
    return {
        carbs: parseFloat(document.getElementById('carbs').value) || 0,
        protein: parseFloat(document.getElementById('protein').value) || 0,
        fat: parseFloat(document.getElementById('fat').value) || 0,
        vitamins: parseFloat(document.getElementById('vitamins').value) || 0
    };
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

async function generateAndShowPlans() {
    const current = getCurrentNutrients();
    const curCal = getCurrentCalories();
    const maxCal = getMaxCalories();
    const ignoreLimit = getIgnoreLimit();
    
    const calcBtn = document.getElementById('calculateBtn');
    const originalText = calcBtn.textContent;
    calcBtn.textContent = '⚡ Generating...';
    calcBtn.disabled = true;
    
    setTimeout(() => {
        try {
            const plans = generateOptimalPlans(current, curCal, maxCal, ignoreLimit, 20, 10000);
            if (plans.length === 0) {
                // No plans means current state is already optimal
                const emptyPlan = {
                    meals: [],
                    final: { ...current },
                    caloriesUsed: 0,
                    diff: Math.max(current.carbs, current.protein, current.fat, current.vitamins) -
                           Math.min(current.carbs, current.protein, current.fat, current.vitamins)
                };
                displayPlan(emptyPlan, current);
                const section = document.getElementById('optimalPlansSection');
                if (section) section.style.display = 'none';
                const mealListDiv = document.getElementById('mealList');
                if (mealListDiv) {
                    mealListDiv.innerHTML = '✨ Your current nutrient balance is already perfect and calories are maxed out! No additional food needed.';
                }
                calcBtn.textContent = originalText;
                calcBtn.disabled = false;
                return;
            }
            currentOptimalPlans = plans;
            selectedPlanIndex = 0;
            renderPlanList(plans, (idx) => {
                selectedPlanIndex = idx;
                displayPlan(plans[idx], current);
                renderPlanList(plans, (i) => { selectedPlanIndex = i; displayPlan(plans[i], current); renderPlanList(plans, (i2) => {}, selectedPlanIndex); }, selectedPlanIndex);
            }, selectedPlanIndex);
            displayPlan(plans[0], current);
        } catch (err) {
            console.error(err);
            alert('An error occurred while generating plans.');
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
    const plan = generateRandomPlanOnly(current, curCal, maxCal, ignoreLimit);
    if (plan) {
        displayPlan(plan, current);
        const section = document.getElementById('optimalPlansSection');
        if (section) section.style.display = 'none';
        if (plan.meals.length === 0) {
            const mealListDiv = document.getElementById('mealList');
            if (mealListDiv) {
                mealListDiv.innerHTML = '✨ Your current nutrient balance is already perfect and calories are maxed out! No additional food needed.';
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
            currentOptimalPlans = [];
            selectedPlanIndex = -1;
            const section = document.getElementById('optimalPlansSection');
            if (section) section.style.display = 'none';
        };
        const label = document.createElement('label');
        label.textContent = `${food.name} (C${food.carbs} P${food.protein} F${food.fat} V${food.vitamins} | ${food.cal} cal)`;
        div.appendChild(cb);
        div.appendChild(label);
        container.appendChild(div);
    }
}

function initEventListeners() {
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
        currentOptimalPlans = [];
        selectedPlanIndex = -1;
        const section = document.getElementById('optimalPlansSection');
        if (section) section.style.display = 'none';
    };
    document.getElementById('foodSearch').oninput = () => buildFoodUI();
    document.getElementById('calculateBtn').onclick = generateAndShowPlans;
    document.getElementById('randomizeBtn').onclick = generateRandomPlan;
    
    const inputs = ['carbs', 'protein', 'fat', 'vitamins', 'curCalories', 'maxCalories', 'ignoreCalorieLimit', 'tier', 'disableTierFilter', 'biomeFilter', 'disableBiomeFilter'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                const nutrients = getCurrentNutrients();
                drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
            });
            if (el.type === 'number') {
                el.addEventListener('input', () => {
                    const nutrients = getCurrentNutrients();
                    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
                });
            }
        }
    });
    
    const nutrients = getCurrentNutrients();
    drawPie('beforeChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    drawPie('afterChart', nutrients.carbs, nutrients.protein, nutrients.fat, nutrients.vitamins);
    buildFoodUI();
}

initEventListeners();
